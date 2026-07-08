import streamlit as st

from app.pages import (
    analytics,
    crm_dashboard,
    customers,
    deliveries,
    feedback,
    inventory,
    login,
    loyalty,
    profile,
    promotions,
    purchases,
    suppliers,
    transactions,
)
from app.theme import inject_theme

st.set_page_config(page_title="Chickie", page_icon="🐔", layout="wide")

if "user" not in st.session_state:
    st.session_state.user = None

user = st.session_state.user
inject_theme(user["accent_color"] if user else "#dc2626")

if user is None:
    pg = st.navigation([st.Page(login.render, title="Sign In / Sign Up", icon="🔑")])
else:
    is_owner = user["role"] == "owner"

    scm_pages = [
        st.Page(inventory.render, title="Inventory", icon="📦", url_path="inventory", default=True),
        st.Page(suppliers.render, title="Suppliers", icon="🚚", url_path="suppliers"),
        st.Page(deliveries.render, title="Deliveries", icon="📅", url_path="deliveries"),
        st.Page(purchases.render, title="Purchases", icon="🧾", url_path="purchases"),
    ]
    if is_owner:
        scm_pages += [
            st.Page(transactions.render, title="Transactions", icon="💳", url_path="transactions"),
            st.Page(analytics.render, title="Analytics", icon="📊", url_path="analytics"),
        ]

    crm_pages = [
        st.Page(crm_dashboard.render, title="Dashboard", icon="❤️", url_path="crm-dashboard"),
        st.Page(customers.render, title="Customers", icon="👥", url_path="customers"),
        st.Page(loyalty.render, title="Loyalty", icon="🏆", url_path="loyalty"),
        st.Page(feedback.render, title="Feedback", icon="💬", url_path="feedback"),
        st.Page(promotions.render, title="Promotions", icon="🎯", url_path="promotions"),
    ]

    account_pages = [st.Page(profile.render, title="Profile", icon="⚙️", url_path="profile")]

    pg = st.navigation({"SCM": scm_pages, "CRM": crm_pages, "Account": account_pages})

    with st.sidebar:
        st.markdown(f"**{user['name']}**")
        st.caption(f"{user['role'].title()} · {user['email']}")

pg.run()
