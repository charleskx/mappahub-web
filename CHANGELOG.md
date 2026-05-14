# Changelog

Todas as mudanças notáveis deste projeto serão documentadas aqui.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/)
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [Unreleased]

## [0.0.1] - 2026-05-14

### Adicionado
- Update annual plan to 10% discount and geocoding priority benefit
- Add Sentry error tracking; remove admin geocoding logs tab
- Update pricing and features for monthly and annual plans
- Geocoding logs UI, partner filters, ticket fixes and notifications improvements
- Full support ticket UI
- Add users panel with 2FA removal per tenant
- Disable readonly dynamic fields in edit sheet
- Show geocode status as disabled field in edit sheet
- Add custom fields and notes to edit/create sheet
- Expand partner popup with all fields, notes, and edit navigation
- 2FA recovery codes UI
- Branded error page for disabled public map (403 vs 404)
- Apply publicMapEnabled guard to PublicMapsPage
- Animated promo page for disabled public map in IntegrationsPage
- Remove Google Maps API key from UI and types
- Replace plain logo with Powered by Atlasync link in public map
- Restore iframe/script toggle in integrations embed cards
- Wire dashboard to real data from /dashboard/stats API
- Add filter sidebar to internal map (search, state, city, type, visibility)
- Add geolocation to public map with radius filtering
- Make public map self-contained, responsive and embeddable
- Add filter panel to public map (state, city, pin type, search)
- Show pin info popup on click in public map
- Add PublicMapsPage as internal Shell route for /public-map
- Teardrop pin icons and marker clustering on both maps
- Migrate maps from Google Maps to Leaflet + OpenStreetMap
- Replace window.confirm with ConfirmDialog component in pin types
- Add pin types CRUD and wire into app navigation
- Complete React frontend for Atlasync

### Corrigido
- Resolve all TypeScript build errors
- Only show current plan badge when subscription is actually active
- Allow navigation to /billing and /support when blocked
- Show subscription wall instead of logging out on inactive plans
- Correct ticket icon — use d prop instead of children
- Update trial period from 30 days to 14 days across multiple components
- Disable novo embed/mapa buttons when publicMapEnabled is false
- Move promo animations to globals.css so keyframes actually load
- Broken icon and empty-state bypass in IntegrationsPage
- Disable embed creation and show warning when publicMapEnabled is false
- Use network-based geolocation to avoid POSITION_UNAVAILABLE on desktop
- Distinguish geolocation error codes for better UX in Arc/Chromium
- Restore missing Select import in MapPage after refactor
- Decouple internal map from map entities — always show all partners
- Align delete icon with active badge in integrations card header
- Add fallback subtitle to imports stat card for alignment consistency
- Remove redundant pin count from filter sidebar in internal map
- Ensure map markers render by fixing init race condition and container height
- Move mobile bottom sheet to fixed position outside overflow:hidden container
- Replace window.confirm with ConfirmDialog in Partners and Team pages
- Fetch Maps API key dynamically in PublicMapPage via public config endpoint
- Add loading=async to Maps script and guard marker init against failed map
- Remove fullscreen mode on map route so sidebar remains visible
- Pass mutation vars explicitly to avoid stale closure in PinTypeModal
- Restore form interactivity in PinTypeModal
- Correct BillingPage spacing and card padding
- Correct BillingPage layout and planType field references
- Correct API response shape mismatches found by live testing
- Align frontend with design system and correct API endpoints


## [1.0.0] - 2026-05-13

### Adicionado
- Tela de login com suporte a 2FA (TOTP)
- Registro de conta com tenant e plano trial automático
- Onboarding guiado após o primeiro acesso
- Dashboard com métricas de parceiros, importações e geocoding
- Listagem de parceiros com busca, filtros (visibilidade, tipo de pin, status geocoding, origem) e paginação
- Formulário de cadastro e edição de parceiros em sheet lateral
- Banner de falhas de geocoding na tela de parceiros
- Tela de logs de geocoding com detalhes por parceiro e atalho de edição de endereço
- Mapas interativos com Leaflet, clustering e seleção de parceiros
- Mapas públicos com embed via token
- Importação de parceiros via Excel com preview e histórico de jobs
- Exportação de parceiros em Excel
- Tipos de pin customizáveis com cor
- Gerenciamento de equipe com convites por e-mail
- Configurações de conta e perfil
- Faturamento com planos mensal e anual, troca via Stripe Customer Portal
- Subscription wall para contas canceladas/inadimplentes (login funciona, acesso restrito a faturamento e suporte)
- Integração de suporte via tickets com thread de mensagens
- Sino de notificações com badge de não lidas e navegação por tipo
- Super admin: gestão de tenants, histórico de imports, gerenciamento de 2FA por usuário
- Tema claro/escuro
- Sentry para captura de erros com session replay
