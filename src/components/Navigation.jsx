import { NavLink } from 'react-router-dom';

export default function Navigation() {
    return (
        <nav className="bottom-nav">
            <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span className="nav-icon">
                    <img src="/penguin-icon.png" alt="Home" />
                </span>
                <span>首頁</span>
            </NavLink>
            <NavLink to="/upload" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span className="nav-icon nav-icon-text">📷</span>
                <span>新增</span>
            </NavLink>
            <NavLink to="/album" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span className="nav-icon nav-icon-text">🖼️</span>
                <span>相冊</span>
            </NavLink>
            <NavLink to="/stats" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span className="nav-icon nav-icon-text">📊</span>
                <span>統計</span>
            </NavLink>
        </nav>
    );
}
