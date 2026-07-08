import streamlit as st

from app import store
from app.utils import CATEGORIES, stock_status, supplier_name

STATUS_ICON = {"Critical": "🔴", "Low": "🟡", "Healthy": "🟢"}


@st.dialog("Inventory Item")
def _item_dialog(suppliers: list[dict], org_id: str, is_owner: bool, item: dict | None = None):
    editing = item is not None
    st.subheader("Edit Item" if editing else "Add Item")

    supplier_options = ["— No supplier yet —"] + [s["name"] for s in suppliers]
    supplier_ids = [None] + [s["id"] for s in suppliers]
    current_supplier_idx = supplier_ids.index(item["supplier_id"]) if editing and item["supplier_id"] in supplier_ids else 0

    with st.form("item_form"):
        name = st.text_input("Name", value=item["name"] if editing else "")
        category = st.selectbox("Category", CATEGORIES, index=CATEGORIES.index(item["category"]) if editing else 0)
        supplier_idx = st.selectbox("Supplier", range(len(supplier_options)), format_func=lambda i: supplier_options[i], index=current_supplier_idx)
        unit = st.text_input("Unit", value=item["unit"] if editing else "", placeholder="kg, L, pcs...")
        col1, col2, col3 = st.columns(3)
        quantity = col1.number_input("Quantity", min_value=0.0, value=float(item["quantity"]) if editing else 0.0)
        par = col2.number_input("Par level", min_value=0.0, value=float(item["par"]) if editing else 0.0)
        reorder_point = col3.number_input("Reorder point", min_value=0.0, value=float(item["reorder_point"]) if editing else 0.0)

        if is_owner:
            unit_cost = st.number_input("Unit cost (₱)", min_value=0.0, value=float(item["unit_cost"]) if editing else 0.0)
        else:
            unit_cost = item["unit_cost"] if editing else 0.0
            st.caption("Unit cost is only editable by the owner.")

        submitted = st.form_submit_button("Save", type="primary", use_container_width=True)

    if submitted:
        if not name.strip() or not unit.strip():
            st.error("Name and unit are required.")
            return
        fields = {
            "name": name.strip(),
            "category": category,
            "supplier_id": supplier_ids[supplier_idx],
            "unit": unit.strip(),
            "quantity": quantity,
            "par": par,
            "reorder_point": reorder_point,
            "unit_cost": unit_cost,
        }
        if editing:
            store.update_inventory_item(org_id, item["id"], **fields)
            st.toast("Item updated!", icon="✅")
        else:
            store.add_inventory_item(org_id, **fields)
            st.toast("Item added to inventory!", icon="✅")
        st.rerun()


@st.dialog("Delete Item")
def _delete_dialog(org_id: str, item: dict):
    st.write(f"Delete **{item['name']}**? This also removes its purchase history. This can't be undone.")
    col1, col2 = st.columns(2)
    if col1.button("Cancel", use_container_width=True):
        st.rerun()
    if col2.button("Delete", type="primary", use_container_width=True):
        store.delete_inventory_item(org_id, item["id"])
        st.toast(f"Deleted {item['name']}.", icon="🗑️")
        st.rerun()


def render() -> None:
    user = st.session_state.user
    org_id = user["organization_id"]
    is_owner = user["role"] == "owner"

    inventory = store.list_inventory(org_id)
    suppliers = store.list_suppliers(org_id)

    st.title("📦 Inventory")

    statuses = {i["id"]: stock_status(i) for i in inventory}
    critical = sum(1 for s in statuses.values() if s == "Critical")
    low = sum(1 for s in statuses.values() if s == "Low")
    healthy = sum(1 for s in statuses.values() if s == "Healthy")

    cols = st.columns(4)
    cols[0].metric("Total Items", len(inventory))
    cols[1].metric("Critical", critical)
    cols[2].metric("Low", low)
    if is_owner:
        stock_value = round(sum(i["quantity"] * i["unit_cost"] for i in inventory))
        cols[3].metric("Stock Value", f"₱{stock_value:,}")
    else:
        cols[3].metric("Healthy", healthy)

    top = st.columns([3, 2, 2, 1])
    search = top[0].text_input("Search", placeholder="Search by name or category…", label_visibility="collapsed")
    category_filter = top[1].selectbox("Category", ["All"] + CATEGORIES, label_visibility="collapsed")
    status_filter = top[2].selectbox("Status", ["All", "Critical", "Low", "Healthy"], label_visibility="collapsed")
    if top[3].button("➕ Add Item", type="primary", use_container_width=True):
        _item_dialog(suppliers, org_id, is_owner)

    filtered = inventory
    if search:
        s = search.lower()
        filtered = [i for i in filtered if s in i["name"].lower() or s in i["category"].lower()]
    if category_filter != "All":
        filtered = [i for i in filtered if i["category"] == category_filter]
    if status_filter != "All":
        filtered = [i for i in filtered if statuses[i["id"]] == status_filter]

    if not inventory:
        st.info("No inventory yet — add an item to get started.")
        return
    if not filtered:
        st.info("No items match your filters.")
        return

    st.divider()
    for item in filtered:
        status = statuses[item["id"]]
        pct = min(100, round(item["quantity"] / item["par"] * 100)) if item["par"] else 0
        with st.container(border=True):
            cols = st.columns([3, 2, 2, 2, 2, 1.5, 1, 1])
            cols[0].markdown(f"**{item['name']}**  \n:gray[{item['category']}]")
            cols[1].write(supplier_name(suppliers, item["supplier_id"]))
            cols[2].progress(pct / 100, text=f"{item['quantity']:g} / {item['par']:g} {item['unit']}")
            if is_owner:
                cols[3].write(f"₱{item['unit_cost']:.2f}/{item['unit']}")
                cols[4].write(f"₱{item['quantity'] * item['unit_cost']:,.2f}")
            else:
                cols[3].write("")
                cols[4].write("")
            cols[5].markdown(f"{STATUS_ICON[status]} {status}")
            if cols[6].button("✏️", key=f"edit-{item['id']}"):
                _item_dialog(suppliers, org_id, is_owner, item)
            if cols[7].button("🗑️", key=f"del-{item['id']}"):
                _delete_dialog(org_id, item)
