import { supabase } from "../../lib/supabase";
import {
	enqueueMutation,
	hasPendingMutationsForIdea,
	loadMutationQueue,
	removeMutationsForIdea,
} from "./queue";
import {
	findUnsyncedIdea,
	isUnsyncedIdea,
	loadUnsyncedIdeas,
	removeUnsyncedIdea,
	updateUnsyncedIdea,
	upsertUnsyncedIdea,
} from "./storage";
import {
	SYNC_FAILURE_EVENT,
	SYNC_UPDATED_EVENT,
	startOfflineSyncRunner,
} from "./sync";
import type {
	IdeaRecord,
	IdeaStatus,
	IdeaType,
	MutationEnvelope,
} from "./types";

export type { IdeaRecord, IdeaStatus, IdeaType };
export { startOfflineSyncRunner, SYNC_FAILURE_EVENT, SYNC_UPDATED_EVENT };

function createEnvelope(
	ideaId: string,
	opType: MutationEnvelope["op_type"],
	payload: MutationEnvelope["payload"],
): MutationEnvelope {
	return {
		idempotency_key: crypto.randomUUID(),
		idea_id: ideaId,
		op_type: opType,
		payload,
		created_at: new Date().toISOString(),
	};
}

export async function createIdeaLocalFirst(
  idea: IdeaRecord,
): Promise<{ idea: IdeaRecord; unsynced: boolean }> {
  if (typeof navigator !== "undefined" && navigator.onLine) {
    try {
      const { error } = await supabase.from("ideas").insert(idea);
      if (!error) {
        return { idea, unsynced: false };
      }
    } catch {
      // Proceed to local storage logic on error or exception
    }
  }

  upsertUnsyncedIdea(idea);
  enqueueMutation(createEnvelope(idea.id, "create", idea));
  return { idea, unsynced: true };
}

export async function loadIdeasMerged(): Promise<
	(IdeaRecord & { unsynced?: boolean })[]
> {
	const localUnsynced = loadUnsyncedIdeas();

	const { data, error } = await supabase
		.from("ideas")
		.select("id, idea_type, title, raw_input, status, created_at, updated_at");

	const syncedIdeas: IdeaRecord[] = error
		? []
		: (data ?? []).map((item) => ({
				id: item.id,
				idea_type: item.idea_type,
				title: item.title,
				raw_input: item.raw_input,
				status: item.status,
				created_at: item.created_at,
				updated_at: item.updated_at,
			}));

	const unsyncedIdeas = localUnsynced.map((item) => ({
		...item,
		unsynced: true,
	}));
	return [...syncedIdeas, ...unsyncedIdeas];
}

export async function loadIdeaById(
	id: string,
): Promise<(IdeaRecord & { unsynced?: boolean }) | null> {
	const { data, error } = await supabase
		.from("ideas")
		.select(
			"id, idea_type, title, raw_input, status, final_note, current_state, turn_count_in_state, collected, created_at, updated_at",
		)
		.eq("id", id)
		.maybeSingle();

	if (!error && data) {
		return {
			id: data.id,
			idea_type: data.idea_type,
			title: data.title,
			raw_input: data.raw_input,
			status: data.status,
			final_note: data.final_note,
			current_state: data.current_state,
			turn_count_in_state: data.turn_count_in_state,
			collected: data.collected,
			created_at: data.created_at,
			updated_at: data.updated_at,
			unsynced: false,
		};
	}

	const localIdea = findUnsyncedIdea(id);
	return localIdea ? { ...localIdea, unsynced: true } : null;
}

export async function updateIdeaLocalFirst(
	idea: IdeaRecord,
	patch: Partial<IdeaRecord>,
	opType: MutationEnvelope["op_type"] = "update",
) {
	const updatedAt = patch.updated_at ?? new Date().toISOString();
	const patchWithTimestamp = { ...patch, updated_at: updatedAt };
	const updated = { ...idea, ...patchWithTimestamp };

	if (isUnsyncedIdea(idea.id)) {
		updateUnsyncedIdea(idea.id, updated);
		enqueueMutation(createEnvelope(idea.id, opType, patchWithTimestamp));
		return;
	}

  if (typeof navigator !== "undefined" && navigator.onLine) {
    const { error } = await supabase
      .from("ideas")
      .update(patchWithTimestamp)
      .eq("id", idea.id);
    if (!error) return;
  }

	upsertUnsyncedIdea(updated);
	enqueueMutation(createEnvelope(idea.id, opType, patchWithTimestamp));
}

export async function archiveIdeaLocalFirst(idea: IdeaRecord) {
	const patch: Partial<IdeaRecord> = {
		status: "archived",
		updated_at: new Date().toISOString(),
	};
	await updateIdeaLocalFirst(idea, patch, "archive");
}

export async function deleteIdeaLocalFirst(idea: IdeaRecord) {
	if (isUnsyncedIdea(idea.id)) {
		removeUnsyncedIdea(idea.id);
		removeMutationsForIdea(idea.id);
		return;
	}

  if (typeof navigator !== "undefined" && navigator.onLine) {
    const { error } = await supabase.from("ideas").delete().eq("id", idea.id);
    if (!error) return;
  }

	enqueueMutation(createEnvelope(idea.id, "delete", {}));
}

export function hasPendingMutations(ideaId: string): boolean {
	return hasPendingMutationsForIdea(ideaId, loadMutationQueue());
}
