import streamlit as st

from app.analytics import inventory_by_category_chart_png


def render() -> None:
    user = st.session_state.user
    org_id = user["organization_id"]

    st.title("📊 Analytics")
    st.subheader("Inventory Value by Category")
    st.caption("Estimated on-hand value (PHP) — rendered server-side with matplotlib")

    png_bytes = inventory_by_category_chart_png(org_id)
    st.image(png_bytes, use_container_width=True)
