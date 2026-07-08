import streamlit as st


def _clamp(n: float) -> int:
    return min(255, max(0, round(n)))


def shade(hex_color: str, percent: float) -> str:
    """Lightens (positive percent) or darkens (negative percent) a hex color
    by interpolating each channel toward white/black, so the result stays a
    visible tint of the original hue instead of washing out to grey."""
    num = int(hex_color.lstrip("#"), 16)
    fraction = percent / 100
    target = 255 if fraction >= 0 else 0
    r, g, b = (num >> 16) & 0xFF, (num >> 8) & 0xFF, num & 0xFF
    mix = lambda c: _clamp(c + (target - c) * abs(fraction))  # noqa: E731
    return f"#{mix(r):02x}{mix(g):02x}{mix(b):02x}"


def inject_theme(accent_color: str = "#dc2626") -> None:
    bg = shade(accent_color, 92)
    dark = shade(accent_color, -15)
    st.markdown(
        f"""
        <style>
        [data-testid="stAppViewContainer"] {{ background-color: {bg}; }}
        [data-testid="stHeader"] {{ background-color: transparent; }}
        .stButton > button[kind="primary"] {{
            background-color: {accent_color};
            border-color: {accent_color};
        }}
        .stButton > button[kind="primary"]:hover {{
            background-color: {dark};
            border-color: {dark};
        }}
        [data-testid="stMetricValue"] {{ color: {dark}; }}
        </style>
        """,
        unsafe_allow_html=True,
    )
