import streamlit as st

from app import auth

THEMES = {
    "default": ("Chickie Red", "#dc2626"),
    "crimson": ("Deep Crimson", "#be123c"),
    "ocean": ("Ocean Blue", "#2563eb"),
    "forest": ("Forest Green", "#047857"),
}


def render() -> None:
    user = st.session_state.user

    st.title("⚙️ Profile")
    tab_profile, tab_security, tab_appearance = st.tabs(["Profile", "Security", "Appearance"])

    with tab_profile:
        with st.form("profile_form"):
            name = st.text_input("Display Name", value=user["name"])
            st.text_input("Email", value=user["email"], disabled=True)
            phone = st.text_input("Phone", value=user["phone"] or "")
            bio = st.text_area("Bio", value=user["bio"] or "")
            submitted = st.form_submit_button("Save Profile", type="primary")
        if submitted:
            if not name.strip():
                st.error("Display name cannot be empty.")
            else:
                st.session_state.user = auth.update_profile(user["id"], name=name.strip(), phone=phone, bio=bio)
                st.toast("Profile updated!", icon="✅")
                st.rerun()

    with tab_security:
        with st.form("password_form"):
            current_pw = st.text_input("Current Password", type="password")
            new_pw = st.text_input("New Password", type="password")
            confirm_pw = st.text_input("Confirm New Password", type="password")
            submitted = st.form_submit_button("Change Password", type="primary")
        if submitted:
            if len(new_pw) < 6:
                st.error("New password must be at least 6 characters.")
            elif new_pw != confirm_pw:
                st.error("Passwords do not match.")
            else:
                error = auth.change_password(user["id"], current_pw, new_pw)
                if error:
                    st.error(error)
                else:
                    st.toast("Password changed successfully!", icon="✅")

        st.divider()
        if st.button("Sign Out"):
            st.session_state.user = None
            st.rerun()

    with tab_appearance:
        theme_id = st.radio(
            "Dashboard Theme",
            list(THEMES.keys()),
            format_func=lambda k: THEMES[k][0],
            index=list(THEMES.keys()).index(user["theme"]) if user["theme"] in THEMES else 0,
        )
        accent_color = st.color_picker("Accent Color", value=THEMES[theme_id][1])
        st.write("Preview:")
        st.markdown(
            f"<div style='background:{accent_color};padding:1rem;border-radius:0.5rem;color:white'>{user['name']}</div>",
            unsafe_allow_html=True,
        )
        if st.button("Save Appearance", type="primary"):
            st.session_state.user = auth.update_profile(user["id"], theme=theme_id, accent_color=accent_color)
            st.toast("Appearance saved!", icon="✅")
            st.rerun()
