import { Link, Outlet } from "react-router-dom"

export default function Layout() {
  return (
    <div>
      <header>
        <nav>
          <Link to="/capture">捕获</Link> | <Link to="/library">想法库</Link> |{" "}
          <Link to="/review">每周回顾</Link> | <Link to="/settings">设置</Link>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
