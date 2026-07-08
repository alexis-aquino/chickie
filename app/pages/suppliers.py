import streamlit as st

from app import store
from app.utils import format_date, initials


def render() -> None:
    user = st.session_state.user
    org_id = user["organization_id"]

    suppliers = store.list_suppliers(org_id)
    inventory = store.list_inventory(org_id)

    st.title("🚚 Suppliers")

    if not suppliers:
        st.info("No suppliers yet.")
        return

    item_counts: dict[str, int] = {}
    for i in inventory:
        if i["supplier_id"]:
            item_counts[i["supplier_id"]] = item_counts.get(i["supplier_id"], 0) + 1

    cols = st.columns(3)
    for idx, s in enumerate(suppliers):
        with cols[idx % 3]:
            with st.container(border=True):
                st.markdown(f"### {initials(s['name'])}  {s['name']}")
                badge = "🟢 Active" if s["status"] == "Active" else "🟠 On Hold"
                st.write(badge)
                st.caption(", ".join(s["categories"]))
                st.write(f"👤 {s['contact']}")
                st.write(f"📞 {s['phone']}")
                c1, c2 = st.columns(2)
                c1.metric("Rating", f"{s['rating']:.1f} ⭐")
                c2.metric("On-time", f"{s['on_time_rate']:.0f}%")
                st.caption(f"{item_counts.get(s['id'], 0)} items supplied")
                st.caption(f"Last delivery: {format_date(s['last_delivery']) if s['last_delivery'] else '—'}")
