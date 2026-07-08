import streamlit as st

from app import store
from app.utils import format_date, initials


def render() -> None:
    user = st.session_state.user
    org_id = user["organization_id"]

    customers = store.list_customers(org_id)

    st.title("💬 Feedback")

    all_feedback = []
    for c in customers:
        for f in c["feedback"]:
            all_feedback.append({**f, "customer": c})
    all_feedback.sort(key=lambda f: f["date"], reverse=True)

    total = len(all_feedback)
    avg = sum(f["rating"] for f in all_feedback) / total if total else 0
    positive = sum(1 for f in all_feedback if f["rating"] >= 4)
    negative = sum(1 for f in all_feedback if f["rating"] <= 2)

    cols = st.columns(4)
    cols[0].metric("Total Reviews", total)
    cols[1].metric("Average Rating", f"{avg:.1f} ⭐")
    cols[2].metric("Positive (4-5★)", f"{round(positive / total * 100) if total else 0}%")
    cols[3].metric("Negative (1-2★)", f"{round(negative / total * 100) if total else 0}%")

    st.write("**Rating Distribution**")
    for stars in range(5, 0, -1):
        count = sum(1 for f in all_feedback if f["rating"] == stars)
        pct = round(count / total * 100) if total else 0
        st.progress(pct / 100, text=f"{'⭐' * stars} — {count} ({pct}%)")

    st.divider()
    rating_filter = st.selectbox("Filter by rating", ["All", "5", "4", "3", "2", "1"])
    rows = all_feedback if rating_filter == "All" else [f for f in all_feedback if str(f["rating"]) == rating_filter]

    if not rows:
        st.info("No feedback matches this filter.")
        return

    for f in rows:
        c = f["customer"]
        order = next((o for o in c["orders"] if o["id"] == f["order_id"]), None)
        items = ", ".join(i["name"] for i in order["items"]) if order else "—"
        with st.container(border=True):
            st.markdown(f"**{initials(c['name'])} {c['name']}** :gray[({c['tier']})] — {format_date(f['date'])}")
            st.write("⭐" * f["rating"])
            st.write(f"*{f['comment']}*")
            st.caption(f"Order items: {items}")
