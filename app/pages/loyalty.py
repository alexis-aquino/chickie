import streamlit as st

from app import store
from app.utils import TIER_CONFIG, initials, next_tier, total_spent

TIER_BENEFITS = {
    "Bronze": "Standard menu access, birthday treat.",
    "Silver": "5% discount on orders, priority seating.",
    "Gold": "10% discount, free delivery, exclusive promos.",
}


def render() -> None:
    user = st.session_state.user
    org_id = user["organization_id"]

    customers = store.list_customers(org_id)

    st.title("🏆 Loyalty Program")

    cols = st.columns(3)
    for col, tier in zip(cols, ["Bronze", "Silver", "Gold"]):
        count = sum(1 for c in customers if c["tier"] == tier)
        cfg = TIER_CONFIG[tier]
        subtitle = f"{cfg['min']:,}+ pts" if cfg["max"] is None else f"{cfg['min']:,}–{cfg['max']:,} pts"
        with col:
            with st.container(border=True):
                st.markdown(f"### {tier}")
                st.caption(subtitle)
                st.metric("Members", count)
                st.write(TIER_BENEFITS[tier])

    st.divider()
    st.subheader("Points Leaderboard")
    leaderboard = sorted(customers, key=lambda c: c["loyalty_points"], reverse=True)

    for rank, c in enumerate(leaderboard, start=1):
        nt = next_tier(c["tier"])
        with st.container(border=True):
            cols = st.columns([0.5, 3, 1.5, 2, 1.5, 3])
            cols[0].write(f"#{rank}")
            cols[1].markdown(f"**{initials(c['name'])} {c['name']}**  \n:gray[{c['tier']}]")
            cols[2].write(f"{c['loyalty_points']:,} pts")
            cols[3].write(f"₱{total_spent(c):,.0f}")
            cols[4].write(f"{len(c['orders'])} orders")
            if nt:
                threshold = TIER_CONFIG[nt]["min"]
                pct = min(100, round(c["loyalty_points"] / threshold * 100)) if threshold else 100
                pts_to_next = max(0, threshold - c["loyalty_points"])
                cols[5].progress(pct / 100, text=f"{pts_to_next:,} pts to {nt}")
            else:
                cols[5].write("⚡ Max tier reached")
