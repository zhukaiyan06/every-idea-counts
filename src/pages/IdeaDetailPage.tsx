import { useParams } from "react-router-dom"

export default function IdeaDetailPage() {
  const { id } = useParams()

  return (
    <section>
      <h1>想法详情</h1>
      <p>{id}</p>
    </section>
  )
}
