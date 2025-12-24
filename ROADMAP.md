# Post-MVP Enhancement Roadmap

## 1. Security & Authorization
- [ ] **Data Access Layer**: Migrate from `allow.authenticated()` to strict resolver-based checks.
- [ ] **Role Enforcement**: Ensure `Owner`, `Admin`, `Member`, `BillingAdmin` permissions are enforced at the API level (not just UI).
- [ ] **Tenant Isolation**: Verify that NO data leaks across `orgId` boundaries using automated regression tests (e.g. attempting to read another org's ID).

## 2. User Management
- [ ] **Accept Invite UI**: Implement a page (`/invite/accept?token=...`) that calls the `manageOrg` (action: acceptInvite) mutation.
- [ ] **Role Updates**: Allow Admins to change member roles (Mutation `updateMembership`).
- [ ] **Remove Member**: Allow Admins to remove members (Mutation `deleteMembership`).

## 3. Onboarding
- [ ] **New User Flow**: Polish the flow for a brand new user who is not invited (Create Org -> Wizard).
- [ ] **Checklist**: Add an onboarding checklist for new organizations (Draft Vision -> Add Objective).

## 4. Billing (Future)
- [ ] Integrate Stripe.
- [ ] Update `Organization.subscriptionTier` via Webhook.
