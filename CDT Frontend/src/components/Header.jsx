const Header = () => {
  return (
    <header className="header">
      <div className="header-logo">
        <img
          src="/CDT_Logo_terra.svg"
          alt="Campus da Terra"
        />
      </div>
      <nav className="header-nav">
        <a href="#library" className="nav-link">Library</a>
      </nav>
    </header>
  )
}

export default Header