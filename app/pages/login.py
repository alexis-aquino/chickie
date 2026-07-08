import streamlit as st

from app import auth


def render() -> None:
    st.title("🐔 Chickie")
    st.caption("Supply chain & CRM for chicken restaurants — sign in or create an account.")

    tab_in, tab_up = st.tabs(["Sign In", "Sign Up"])

    with tab_in:
        with st.form("login_form"):
            email = st.text_input("Email", key="login_email")
            password = st.text_input("Password", type="password", key="login_password")
            submitted = st.form_submit_button("Sign In", type="primary", use_container_width=True)
        if submitted:
            user, error = auth.login(email, password)
            if error:
                st.error(error)
            else:
                st.session_state.user = user
                st.rerun()

    with tab_up:
        with st.form("signup_form"):
            name = st.text_input("Full Name")
            business_name = st.text_input("Business Name")
            email = st.text_input("Email", key="signup_email")
            role = st.radio("Role", ["owner", "staff"], horizontal=True)
            password = st.text_input("Password", type="password", key="signup_password")
            confirm = st.text_input("Confirm Password", type="password")
            seed_demo = st.checkbox(
                "Populate with sample inventory, suppliers, and customers so I can explore right away.",
                value=True,
            )
            submitted = st.form_submit_button("Create Account", type="primary", use_container_width=True)
        if submitted:
            if not name.strip() or not business_name.strip():
                st.error("Please enter your full name and business name.")
            elif password != confirm:
                st.error("Passwords do not match.")
            elif len(password) < 6:
                st.error("Password must be at least 6 characters.")
            else:
                user, error = auth.register(name.strip(), business_name.strip(), email, password, role, seed_demo)
                if error:
                    st.error(error)
                else:
                    st.session_state.user = user
                    st.rerun()
