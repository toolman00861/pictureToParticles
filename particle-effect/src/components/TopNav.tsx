type TopNavProps = {
  items: string[]
}

export function TopNav({ items }: TopNavProps) {
  return (
    <header className="top-nav">
      <nav aria-label="页面导航">
        <ul className="top-nav__list">
          {items.map((item, index) => (
            <li key={item}>
              <button
                type="button"
                className={index === 0 ? 'top-nav__button top-nav__button--active' : 'top-nav__button'}
              >
                {item}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}

export default TopNav
