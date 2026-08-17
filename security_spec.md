# Security Specification for Firestore Rules

## 1. Data Invariants
- `Category`: Every category must have a unique ID and a valid slug.
- `Product`: Every product must have a price >= 0 and belong to a valid category slug.
- `Order`: Every order must be associated with a valid user ID. Users can only read their own orders.
- `Review`: Users can only create/update their own reviews. Reviews must have a rating between 1 and 5.
- `UserProfile`: Users can only read/update their own profiles. Only admins can change user roles.
- `SiteSettings`: Only admins can update site settings. Anyone can read them.

## 2. The Dirty Dozen Payloads
1.  **Identity Spoofing**: Attempt to create an order for another user.
2.  **Privilege Escalation**: A customer attempting to update their own role to 'admin'.
3.  **Invalid Data**: Creating a product with a negative price.
4.  **Unauthorized Update**: A user attempting to update a review they didn't write.
5.  **Ghost Field Injection**: Adding an `isAdmin` field to a product document.
6.  **ID Poisoning**: Using a 2KB string as a category ID.
7.  **Unprotected Read**: A guest attempting to list all user profiles.
8.  **Status Shortcutting**: A customer attempting to mark their own order as 'Paid' without payment.
9.  **Relational Orphan**: Creating a review for a product ID that doesn't exist.
10. **Immutable Field Change**: Attempting to change `createdAt` on an existing order.
11. **PII Leak**: Listing all users to see their private emails.
12. **System Field Modification**: Modifying `totalSpent` in user profile directly from client.

## 3. Test Runner (Draft)
A `firestore.rules.test.ts` will be implemented to verify these constraints.
