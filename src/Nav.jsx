import Icon from "./Icon";

const MAIN_ITEMS = [
  { page: "home", label: "Home", icon: "home" },
  { page: "quiz", label: "Gioca", icon: "ball" },
  { page: "rank", label: "Classifica", icon: "trophy" },
  { page: "profile", label: "Profilo", icon: "user" },
];

const ADMIN_ITEM = { page: "admin", label: "Admin", icon: "settings" };

export default function Nav({ page, setPage, profile, onLogout }) {
  const items =
    profile.role === "admin" ? [...MAIN_ITEMS, ADMIN_ITEM] : MAIN_ITEMS;

  return (
    <nav>
      {items.map((item) => (
        <button
          key={item.page}
          className={page === item.page ? "active" : ""}
          onClick={() => setPage(item.page)}
        >
          <Icon name={item.icon} size={21} />
          <span>{item.label}</span>
        </button>
      ))}

      <button onClick={onLogout}>
        <Icon name="logout" size={21} />
        <span>Esci</span>
      </button>
    </nav>
  );
}
