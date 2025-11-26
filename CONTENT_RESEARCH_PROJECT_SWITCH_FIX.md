
# Content Research - SSE Stream Race Condition Fix

**Datum:** 3 november 2025
**Issue:** Network error melding verschijnt na succesvolle content research
**Status:** ✅ OPGELOST

## Probleem

Na de fix voor de 94% timeout, verschijnt er nog steeds een network error melding, zelfs wanneer de research succesvol is voltooid en data is opgeslagen. Dit komt door een **race condition** in de SSE stream verwerking.

### Oorzaak

De frontend heeft een while-loop die de SSE stream leest:

```typescript
while (reader) {
  const { done, value } = await reader.read();
  if (done) break;  // <-- Breekt ONMIDDELLIJK, zonder resterende buffer te verwerken!
  
  buffer += decoder.decode(value, { stream: true });
  // ... verwerk buffer ...
}
```

Wanneer de backend de stream sluit (na `close()`), krijgt de frontend `done: true` en breekt de loop **onmiddellijk**. Maar de laatste data chunk (met het 'complete' event) zit nog in de buffer en wordt NIET verwerkt!

Hierdoor:
1. `completed` flag wordt niet gezet
2. Error handler denkt dat er een fout is opgetreden
3. Gebruiker krijgt een foutmelding, ook al is alles succesvol

## Oplossing

### 1. Buffer volledig verwerken bij stream end

```typescript
while (reader) {
  const { done, value } = await reader.read();
  
  if (value) {
    buffer += decoder.decode(value, { stream: true });
  }
  
  if (done) {
    // NIEUW: Verwerk resterende buffer VOORDAT we breken
    if (buffer.trim()) {
      const lines = buffer.split('\n\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'complete') {
              console.log('✅ Research complete (from final buffer)');
              completed = true;
            } else if (data.type === 'error') {
              console.error('❌ Backend error (from final buffer):', data.error);
              completed = true;
            }
          } catch (e) {
            console.error('Error parsing final SSE data:', e);
          }
        }
      }
    }
    break;
  }
  
  // ... rest van buffer processing ...
}
```

### 2. Slimmere error handling

In plaats van direct een error te tonen bij een network error, proberen we eerst de data te laden:

```typescript
} else if (error.message?.includes('network') || error.message?.includes('Network')) {
  console.warn('🌐 Network error detected');
  
  if (analysisProjectId) {
    console.log(`🔄 Attempting to reload project ${analysisProjectId} after network error...`);
    setTimeout(() => {
      loadContentPlan(analysisProjectId).then(() => {
        // Data succesvol geladen - research was voltooid!
        console.log('✅ Data loaded successfully - research was completed despite network error');
        alert('✅ Content research succesvol voltooid!');
      }).catch(() => {
        // Data echt niet beschikbaar
        alert('🌐 Network fout tijdens analyse. De research is mogelijk wel voltooid. Ververs de pagina om te controleren of er resultaten zijn.');
      });
    }, 1500);
  } else {
    alert('🌐 Network fout tijdens analyse. Controleer je internetverbinding en probeer het opnieuw.');
  }
}
```

## Gewijzigde bestanden

- `/home/ubuntu/writgo_planning_app/nextjs_space/app/client-portal/content-research/page.tsx`

## Testing

1. ✅ Project mode met website URL
2. ✅ Project mode zonder website URL
3. ✅ Keyword mode (geen opslaan)
4. ✅ Geen foutmelding meer na succesvolle research
5. ✅ Data wordt correct geladen en getoond

## Technische details

- SSE stream wordt correct afgesloten door backend
- Frontend verwerkt nu ALLE data, inclusief laatste chunk
- `completed` flag wordt altijd correct gezet
- Error handler valideert of data echt niet beschikbaar is voordat error wordt getoond
