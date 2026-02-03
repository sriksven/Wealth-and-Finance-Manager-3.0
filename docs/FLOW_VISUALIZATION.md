# Financial Flow Visualization

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE                            │
│                  (AddTransactionForm)                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ Creates Transaction
                        ↓
┌─────────────────────────────────────────────────────────────┐
│              TRANSACTION CONTEXT (Manager)                   │
│                                                              │
│  • Receives all transaction events                          │
│  • Validates transaction data                               │
│  • Triggers balance updates via handleBalanceUpdate()       │
│  • Stores transaction history                               │
└──────────────┬────────────────────────┬─────────────────────┘
               │                        │
               │ Update                 │ Update
               │ Assets                 │ Liabilities
               ↓                        ↓
┌──────────────────────────┐  ┌────────────────────────┐
│   FINANCE CONTEXT        │  │    CARD CONTEXT        │
│   (Assets)               │  │    (Liabilities)       │
│                          │  │                        │
│ • Bank Accounts          │  │ • Credit Cards         │
│ • Cash                   │  │ • Debit Cards          │
│ • Friend Accounts        │  │                        │
│                          │  │ currentBalance = Debt  │
│ adjustBalance()          │  │ updateCardBalance()    │
└──────────────────────────┘  └────────────────────────┘
```

---

## Transaction Flow Examples

### Example 1: Credit Card Expense
```
USER: "I bought coffee for $5 with my Chase card"
  │
  ↓
TRANSACTION CONTEXT
  │ Creates: { type: 'expense', amount: 5, accountId: 'chase-card-id' }
  │
  ↓ handleBalanceUpdate()
  │ Detects: accountId is a card
  │
  ↓
CARD CONTEXT
  │ updateCardBalance(chase-card-id, +5)
  │
  ↓
RESULT
  ✓ Chase card debt: $100 → $105
  ✓ Net Worth: -$5
```

### Example 2: Bank Income
```
USER: "I received $3000 salary in my checking"
  │
  ↓
TRANSACTION CONTEXT
  │ Creates: { type: 'income', amount: 3000, accountId: 'checking-id' }
  │
  ↓ handleBalanceUpdate()
  │ Detects: accountId is a bank account
  │
  ↓
FINANCE CONTEXT
  │ adjustBalance(checking-id, +3000)
  │
  ↓
RESULT
  ✓ Checking: $500 → $3500
  ✓ Net Worth: +$3000
```

### Example 3: Credit Card Payment
```
USER: "I paid $200 from checking to my Chase card"
  │
  ↓
TRANSACTION CONTEXT
  │ Creates: { type: 'transfer', amount: 200, 
  │           accountId: 'checking-id', toAccountId: 'chase-card-id' }
  │
  ↓ handleBalanceUpdate()
  │ SOURCE: accountId is a bank account
  │ DESTINATION: toAccountId is a card
  │
  ↓
FINANCE CONTEXT               CARD CONTEXT
  │ adjustBalance(checking, -200)    │ updateCardBalance(chase, -200)
  │                                  │
  ↓                                  ↓
RESULT
  ✓ Checking: $500 → $300
  ✓ Chase debt: $105 → -$95 (you overpaid by $95, actually credit balance)
  ✓ Net Worth: No change (money moved)
```

### Example 4: Friend Tracking - You Pay
```
USER: "I paid $100 for dinner, but $40 is Bob's share"
  │
  ↓ Transaction 1: Your Expense
TRANSACTION CONTEXT
  │ Creates: { type: 'expense', amount: 60, accountId: 'chase-card-id',
  │           category: 'Dining Out' }
  │
  ↓ handleBalanceUpdate()
  │
CARD CONTEXT
  │ updateCardBalance(chase-card-id, +60)
  │
  ↓
RESULT (Part 1)
  ✓ Chase debt: +$60
  ✓ Net Worth: -$60
  
  ↓ Transaction 2: Bob's Share (Transfer)
TRANSACTION CONTEXT
  │ Creates: { type: 'transfer', amount: 40, 
  │           accountId: 'chase-card-id', toAccountId: 'friend-bob-id' }
  │
  ↓ handleBalanceUpdate()
  │ SOURCE: card increases debt
  │ DESTINATION: friend account increases balance
  │
  ↓
CARD CONTEXT               FINANCE CONTEXT
  │ updateCardBalance(chase, +40)    │ adjustBalance(friend-bob, +40)
  │                                  │
  ↓                                  ↓
RESULT (Part 2)
  ✓ Chase debt: +$40 (total +$100 for both transactions)
  ✓ Friend-Bob: $0 → $40 (Bob owes you)
  ✓ Net Worth: No change on this part

FINAL RESULT
  ✓ Chase debt: +$100 total (you paid the full bill)
  ✓ Friend-Bob: +$40 (asset - Bob owes you)
  ✓ Net Worth: -$60 (only YOUR share affected your wealth)
```

### Example 5: Friend Pays For You
```
USER: "Bob paid $30 for my Uber"
  │
  ↓
TRANSACTION CONTEXT
  │ Creates: { type: 'expense', amount: 30, 
  │           accountId: 'friend-bob-id', category: 'Transport' }
  │
  ↓ handleBalanceUpdate()
  │ Detects: accountId is a bank account (friend account)
  │
  ↓
FINANCE CONTEXT
  │ adjustBalance(friend-bob-id, -30)
  │
  ↓
RESULT
  ✓ Friend-Bob: $40 → $10 (he owes you less now)
  ✓ Net Worth: -$30 (you still spent the money)
```

### Example 6: Friend Settlement
```
USER: "Bob paid me back the $10 he owes"
  │
  ↓
TRANSACTION CONTEXT
  │ Creates: { type: 'transfer', amount: 10,
  │           accountId: 'friend-bob-id', toAccountId: 'checking-id' }
  │
  ↓ handleBalanceUpdate()
  │ SOURCE: friend account decreases
  │ DESTINATION: bank account increases
  │
  ↓
FINANCE CONTEXT (Friend)      FINANCE CONTEXT (Bank)
  │ adjustBalance(friend-bob, -10)   │ adjustBalance(checking, +10)
  │                                  │
  ↓                                  ↓
RESULT
  ✓ Friend-Bob: $10 → $0 (settled!)
  ✓ Checking: $300 → $310 (real money received)
  ✓ Net Worth: No change (just collecting what was owed)
```

---

## Balance Update Logic (handleBalanceUpdate)

```javascript
function handleBalanceUpdate(transaction, mode) {
    const multiplier = (mode === 'add') ? 1 : -1;
    const amount = transaction.amount * multiplier;
    
    // Identify source account type
    const sourceCard = findCard(transaction.accountId);
    
    switch (transaction.type) {
        case 'expense':
            if (sourceCard) {
                // Credit Card Expense
                updateCardBalance(sourceCard.id, +amount);
                // Positive amount increases debt
            } else {
                // Bank/Cash Expense
                adjustBalance(transaction.accountId, -amount);
                // Negative amount decreases bank balance
            }
            break;
            
        case 'income':
            if (sourceCard) {
                // Refund to Card
                updateCardBalance(sourceCard.id, -amount);
                // Negative amount decreases debt
            } else {
                // Deposit to Bank
                adjustBalance(transaction.accountId, +amount);
                // Positive amount increases bank balance
            }
            break;
            
        case 'transfer':
            // Source loses money
            if (sourceCard) {
                updateCardBalance(sourceCard.id, -amount);
            } else {
                adjustBalance(transaction.accountId, -amount);
            }
            
            // Destination gains money
            const destCard = findCard(transaction.toAccountId);
            if (destCard) {
                // Transfer TO card = payment (reduces debt)
                updateCardBalance(destCard.id, -amount);
            } else {
                // Transfer TO bank/friend (increases balance)
                adjustBalance(transaction.toAccountId, +amount);
            }
            break;
    }
}
```

---

## Net Worth Calculation

```
Net Worth = Total Assets - Total Liabilities

Assets:
  + All Bank Account Balances
  + All Friend Account Balances (positive = they owe you)
  + Cash Balance

Liabilities:
  - All Credit Card Balances (debt)

Example:
  Checking: $500
  Savings: $1000
  Friend-Bob: $40 (he owes you)
  Chase Card: $105 (you owe)
  
  Net Worth = ($500 + $1000 + $40) - $105 = $1435
```

---

## Transaction Type Decision Tree

```
┌─ USER WANTS TO RECORD ─┐
│                         │
├─ Money Leaving? ────────┼─→ EXPENSE
│   │                     │     └─→ Select payment source (bank/card)
│   └─ My money?          │
│                         │
├─ Money Entering? ───────┼─→ INCOME
│   │                     │     └─→ Select destination (bank account)
│   └─ To me?             │
│                         │
├─ Moving Between Accounts?──→ TRANSFER
│   │                     │     ├─→ Bank to Bank (savings, etc.)
│   │                     │     ├─→ Bank to Card (bill payment)
│   │                     │     └─→ Bank to Friend (tracking lend)
│   └─ Same net worth?    │
│                         │
└─────────────────────────┘
```

---

## Common Mistakes & Fixes

### ❌ Mistake 1: Recording split as single expense
```
Wrong: Expense $100 with card (category: Dining Out)
Result: Net Worth -$100 (but only spent $60)
```
```
✓ Correct:
  - Expense $60 with card (Dining Out) 
  - Transfer $40 from card to Friend-Bob
Result: Net Worth -$60, Friend owes $40
```

### ❌ Mistake 2: Using income for friend repayment to card
```
Wrong: Income $40 to card (category: Reimbursement)
Result: Net Worth +$40 (but you're just getting your money back)
```
```
✓ Correct:
  - Transfer $40 from Friend-Bob to Checking
Result: Net Worth unchanged (just collection)
```

### ❌ Mistake 3: Recording card payment as expense
```
Wrong: Expense $200 with card (category: Bills)
Result: Card debt +$200 (doubled!)
```
```
✓ Correct:
  - Transfer $200 from Checking to Card
Result: Checking -$200, Card debt -$200, Net Worth unchanged
```

---

## Key Principles

1. **Every transaction affects exactly 2 accounts** (double-entry)
2. **Expenses and Income change Net Worth**
3. **Transfers do NOT change Net Worth** (just moving money)
4. **Credit Cards are Liabilities** (balance = what you owe)
5. **Friend Accounts are Assets** (positive balance = they owe you)
6. **Always select the actual payment method** (not what you'll pay it with later)

---

## Formula Reference

### Credit Card Balance
```
New Balance = Current Balance + Amount

Expense: +$50 → Debt increases
Payment: -$50 → Debt decreases  
Refund: -$20 → Debt decreases
```

### Bank Account Balance
```
New Balance = Current Balance + Amount

Expense: -$50 → Balance decreases
Income:  +$50 → Balance increases
Transfer Out: -$50 → Balance decreases
Transfer In:  +$50 → Balance increases
```

### Friend Account Balance
```
Positive = They owe you (Asset)
Negative = You owe them (Liability)
Zero = Settled

You pay for them: +Amount (Transfer FROM your source TO friend account)
They pay for you: -Amount (Expense FROM friend account)
They pay you back: -Amount (Transfer FROM friend TO your bank)
```
