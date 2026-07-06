from sqlalchemy.ext.asyncio import AsyncSession
from backend.api.models.alert import Alert, AlertType, AlertSeverity
from backend.api.models.phc import PHC
from backend.api.services.fcm import send_push_notification
from backend.api.services.redis_client import RedisClient
from datetime import datetime, timezone

async def create_alert(
    db: AsyncSession,
    phc_id: int,
    alert_type: AlertType,
    severity: AlertSeverity,
    title: str,
    description: str,
    user_id: int = None
) -> Alert:
    """Create a new alert and send notifications."""
    alert = Alert(
        phc_id=phc_id,
        alert_type=alert_type,
        severity=severity,
        title=title,
        description=description,
        user_id=user_id
    )
    db.add(alert)
    await db.commit()
    await db.refresh(alert)
    
    # Cache active alert
    await RedisClient.set_json(
        f"alert:{alert.id}",
        {
            "id": alert.id,
            "title": alert.title,
            "severity": alert.severity.value,
            "phc_id": alert.phc_id
        },
        ex=3600
    )
    
    # Send push notification
    await send_push_notification(
        title=f"🚨 {severity.value.upper()}: {title}",
        body=description,
        data={"alert_id": str(alert.id), "phc_id": str(phc_id)}
    )
    
    return alert

async def resolve_alert(
    db: AsyncSession,
    alert_id: int
) -> bool:
    """Resolve an alert."""
    from sqlalchemy import select
    from backend.api.models.alert import Alert
    
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        return False
    
    alert.is_resolved = True
    alert.resolved_at = datetime.now(timezone.utc)
    await db.commit()
    
    # Remove from cache
    await RedisClient.delete(f"alert:{alert_id}")
    
    return True