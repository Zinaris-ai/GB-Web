# Ручные шаги для завершения настройки расписания

## ✅ Что уже сделано автоматически:

1. ✅ **Бекапы созданы** в папке `n8n_backup/`
2. ✅ **Switch node исправлен** - теперь использует `httpMethod` вместо `method`
3. ✅ **Webhook node исправлен** - `httpMethod` в правильном формате (массив)
4. ✅ **Старые workflows не тронуты** - все активные workflows остались без изменений
5. ✅ **Workflow "GB Bot Schedule Manager"** готов к активации
6. ✅ **Workflow "GB Bot Auto Scheduler"** готов (не активирован)
7. ✅ **GET запрос протестирован** - endpoint работает, ждет активации

---

## ⚠️ Что нужно сделать ВРУЧНУЮ:

### Шаг 1: Активировать workflow "GB Bot Schedule Manager"

**Почему вручную:** MCP не может активировать workflows через API.

**Инструкция:**
1. Откройте n8n UI: https://n8n210980.hostkey.in
2. Найдите workflow **"GB Bot Schedule Manager"** (ID: `jnpkIndV7GJpwc6s`)
3. Откройте его
4. В правом верхнем углу найдите переключатель **"Inactive/Active"**
5. **Переключите в Active**
6. Сохраните (если требуется)

**Проверка:**
- Статус workflow должен стать "Active"
- В executions не должно быть ошибок

---

### Шаг 2: Создать MongoDB документ для расписания (опционально)

**Важно:** Документ создастся автоматически при первом сохранении с фронта благодаря `upsert: true`. Но для правильных дефолтных значений лучше создать заранее.

**Способ 1: Через временный workflow (рекомендуется)**
1. Откройте workflow **"GB Schedule Init (DELETE AFTER USE)"** (ID: `7d3wX0i1qEQU4Dh0`)
2. **Настройте MongoDB credentials** в ноде "MongoDB Insert Schedule"
3. Нажмите **"Execute Workflow"** (кнопка запуска)
4. Проверьте что execution прошел успешно
5. **Удалите этот workflow** (он больше не нужен)

**Способ 2: Через MongoDB Compass/Shell**
Выполните команду:
```javascript
db.bot_settings.insertOne({
  "_id": "schedule",
  "scheduleEnabled": false,
  "schedule": {
    "0": {"enabled": false, "startTime": "09:00", "endTime": "18:00"},
    "1": {"enabled": true, "startTime": "09:00", "endTime": "18:00"},
    "2": {"enabled": true, "startTime": "09:00", "endTime": "18:00"},
    "3": {"enabled": true, "startTime": "09:00", "endTime": "18:00"},
    "4": {"enabled": true, "startTime": "09:00", "endTime": "18:00"},
    "5": {"enabled": true, "startTime": "09:00", "endTime": "18:00"},
    "6": {"enabled": false, "startTime": "09:00", "endTime": "18:00"}
  }
})
```

**Способ 3: Пропустить**
Просто откройте фронт и сохраните расписание - документ создастся автоматически.

---

### Шаг 3: Протестировать API

**После активации workflow проверьте:**

**Тест GET (через браузер):**
```
https://n8n210980.hostkey.in/webhook/gb/schedule
```

**Ожидаемый результат:**
```json
{
  "scheduleEnabled": false,
  "schedule": {
    "0": {"enabled": false, "startTime": "09:00", "endTime": "18:00"},
    ...
  }
}
```

**Тест POST (через PowerShell):**
```powershell
$body = @{
  scheduleEnabled = $false
  schedule = @{
    "0" = @{enabled = $false; startTime = "09:00"; endTime = "18:00"}
    "1" = @{enabled = $true; startTime = "09:00"; endTime = "18:00"}
    "2" = @{enabled = $true; startTime = "09:00"; endTime = "18:00"}
    "3" = @{enabled = $true; startTime = "09:00"; endTime = "18:00"}
    "4" = @{enabled = $true; startTime = "09:00"; endTime = "18:00"}
    "5" = @{enabled = $true; startTime = "09:00"; endTime = "18:00"}
    "6" = @{enabled = $false; startTime = "09:00"; endTime = "18:00"}
  }
} | ConvertTo-Json -Depth 10

Invoke-WebRequest -Uri "https://n8n210980.hostkey.in/webhook/gb/schedule" -Method POST -Body $body -ContentType "application/json"
```

**Ожидаемый результат:**
```json
{
  "success": true
}
```

---

### Шаг 4: Протестировать фронтенд

1. Откройте фронт на Vercel
2. Зайдите на страницу **"/schedule"** (Расписание)
3. Проверьте что расписание загрузилось
4. Измените расписание (например, включите Понедельник 10:00-17:00)
5. Нажмите **"Сохранить"**
6. Проверьте toast уведомление "Успешно"
7. Обновите страницу (F5)
8. Проверьте что изменения сохранились

---

### Шаг 5: Активировать Auto Scheduler (ПОЗЖЕ!)

**⚠️ НЕ АКТИВИРУЙТЕ СРАЗУ!**

Сначала убедитесь что Schedule Manager работает стабильно 1-2 дня.

**Когда активировать:**
1. Schedule Manager работает без ошибок
2. Фронтенд успешно сохраняет/загружает расписание
3. Вы готовы протестировать автоматическое переключение

**Как активировать:**
1. Откройте workflow **"GB Bot Auto Scheduler"** (ID: `dIW7odI6msPCKf9s`)
2. Проверьте MongoDB credentials в ноде "MongoDB Find Schedule"
3. Настройте тестовое расписание на фронте (включение через 2 минуты)
4. Активируйте workflow
5. Наблюдайте за executions в n8n
6. Проверьте что бот переключается автоматически

---

## 🔍 Проверка что ничего не сломалось

**После всех шагов проверьте:**

- [ ] Статистика работает (страница "/")
- [ ] История чатов работает (страница "/chats")
- [ ] Расписание работает (страница "/schedule")
- [ ] Toggle Bot кнопка работает
- [ ] Все старые workflows активны:
  - GR Toggle bot (active: true)
  - GB bot (active: true)
  - Statistics (active: true)

**Timestamps старых workflows (для проверки):**
- GR Toggle bot: updatedAt = 2025-10-20T15:08:09.000Z
- GB bot: updatedAt = 2025-10-22T12:34:45.000Z
- Statistics: updatedAt = 2025-10-15T09:19:47.000Z

Если timestamps не изменились - значит ничего не сломалось! ✅

---

## 📁 Бекапы

Все бекапы сохранены в папке **`n8n_backup/`**:

- `schedule_manager_backup.json` - оригинальная версия с ошибкой
- `auto_scheduler_backup.json` - Auto Scheduler
- `schedule_init_backup.json` - временный workflow для инициализации
- `existing_workflows_state.json` - состояние старых workflows ДО изменений

**Для отката:**
1. Деактивируйте новые workflows в n8n UI
2. Удалите их через n8n UI
3. Проверьте что старые workflows работают

---

## ✅ Финальный чеклист

- [ ] Workflow "GB Bot Schedule Manager" активирован
- [ ] MongoDB документ создан (или пропущен)
- [ ] GET запрос работает
- [ ] POST запрос работает
- [ ] Фронтенд загружает расписание
- [ ] Фронтенд сохраняет расписание
- [ ] Старые workflows не сломались
- [ ] Временный workflow "GB Schedule Init" удален (опционально)
- [ ] Auto Scheduler НЕ активирован (пока!)

---

## 🚨 Если что-то пошло не так

**Немедленные действия:**
1. Деактивируйте "GB Bot Schedule Manager" в n8n UI
2. Проверьте executions на ошибки
3. Проверьте что старые workflows работают
4. Восстановите из бекапов если нужно

**Типичные проблемы:**
- **404 на /webhook/gb/schedule** → Workflow не активирован
- **500 Internal Server Error** → MongoDB credentials не настроены
- **Валидация на фронте** → Проверьте формат времени HH:MM
- **Данные не сохраняются** → Проверьте MongoDB connection

---

**Время выполнения ручных шагов: ~5-10 минут**

**Готово к запуску!** 🚀

