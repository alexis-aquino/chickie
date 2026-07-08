import io

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
from fastapi import APIRouter, Depends, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models
from app.auth import Principal, get_current_principal
from app.db import get_db

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

_BAR_COLOR = "#dc2626"


@router.get("/inventory-by-category.png")
def inventory_by_category_chart(
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> Response:
    items = db.scalars(
        select(models.InventoryItem).where(models.InventoryItem.organization_id == principal.organization_id)
    ).all()

    totals: dict[str, float] = {}
    for item in items:
        value = float(item.quantity) * float(item.unit_cost)
        totals[item.category] = totals.get(item.category, 0.0) + value

    categories = sorted(totals, key=lambda c: -totals[c])
    values = [totals[c] for c in categories]

    fig, ax = plt.subplots(figsize=(7.5, 4), dpi=150)
    if categories:
        bars = ax.bar(categories, values, color=_BAR_COLOR, width=0.6)
        for bar, value in zip(bars, values):
            ax.text(
                bar.get_x() + bar.get_width() / 2,
                bar.get_height(),
                f"₱{value:,.0f}",
                ha="center",
                va="bottom",
                fontsize=9,
            )
        ax.set_ylabel("Estimated value (PHP)")
        plt.setp(ax.get_xticklabels(), rotation=15, ha="right", fontsize=9)
    else:
        ax.text(0.5, 0.5, "No inventory yet", ha="center", va="center", transform=ax.transAxes, color="#888888")
        ax.set_xticks([])
        ax.set_yticks([])

    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    fig.tight_layout()

    buf = io.BytesIO()
    fig.savefig(buf, format="png", transparent=True)
    plt.close(fig)

    return Response(content=buf.getvalue(), media_type="image/png")
