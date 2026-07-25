import json
from typing import Optional, Dict, Any
from app.db.redis import get_redis

class WorkingMemoryStore:
    """
    Redis working memory store for session context.
    Keys: wm:{session_id}:{run_id}:memory (Redis Hash)
    TTL: 24h
    """
    
    def _key(self, session_id: str, run_id: str) -> str:
        return f"wm:{session_id}:{run_id}:memory"
        
    async def get(self, session_id: str, run_id: str) -> Dict[str, Any]:
        redis = await get_redis()
        key = self._key(session_id, run_id)
        data = await redis.hgetall(key)
        
        if not data:
            return {"facts": {}, "agent_messages": []}
            
        parsed_data = {}
        for k, v in data.items():
            try:
                parsed_data[k] = json.loads(v)
            except json.JSONDecodeError:
                parsed_data[k] = v
        return parsed_data
        
    async def set(self, session_id: str, run_id: str, data: Dict[str, Any]) -> None:
        redis = await get_redis()
        key = self._key(session_id, run_id)
        
        string_data = {k: json.dumps(v) for k, v in data.items()}
        
        if string_data:
            await redis.hset(key, mapping=string_data)
            await redis.expire(key, 86400) # 24 hours TTL
        
    async def get_field(self, session_id: str, run_id: str, field: str) -> Optional[str]:
        redis = await get_redis()
        key = self._key(session_id, run_id)
        val = await redis.hget(key, field)
        return val
        
    async def set_fields(self, session_id: str, run_id: str, fields: Dict[str, Any]) -> None:
        redis = await get_redis()
        key = self._key(session_id, run_id)
        
        string_data = {
            k: json.dumps(v) if not isinstance(v, str) else v 
            for k, v in fields.items()
        }
        
        if string_data:
            await redis.hset(key, mapping=string_data)
            await redis.expire(key, 86400)
            
    async def delete(self, session_id: str, run_id: str) -> None:
        redis = await get_redis()
        key = self._key(session_id, run_id)
        await redis.delete(key)

working_memory_store = WorkingMemoryStore()
