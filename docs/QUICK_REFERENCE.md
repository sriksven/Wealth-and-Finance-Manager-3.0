# 🎯 Quick Reference Card

## Transaction Quick Guide

### 💸 I Spent Money
**Go to**: Add Expense
**Select**: Where you paid from (Bank/Card/Cash)
**Result**: Balance decreases OR Card debt increases

---

### 💰 I Received Money
**Go to**: Add Income
**Select**: Where it went (Bank account)
**Result**: Balance increases

---

### 💳 Paying Credit Card Bill
**Go to**: Pay Card / Transfer
**From**: Your bank account
**To**: Credit Card Bill → Select your card
**Result**: Bank decreases, Card debt decreases, Net worth unchanged

---

### 🏦 Moving Money Between Banks
**Go to**: Pay Card / Transfer
**From**: Source bank account
**To**: Other Bank Account → Select destination
**Result**: Both accounts adjust, Net worth unchanged

---

### 👥 Shared Expense (Simple)
**Go to**: Add Expense
1. Enter TOTAL amount paid
2. Check "Split this expense?"
3. Enter YOUR share
4. System creates: Your expense + Lending entry

**When friend pays back**:
- Add Income → Category: Reimbursement

---

### 👥 Shared Expense (Advanced - Splitwise Style)

**ONE-TIME SETUP**: Create account "Friend - [Name]"

#### When YOU pay for shared dinner ($100 total, $60 yours, $40 theirs):

**Step 1**: Record YOUR expense
- Add Expense
- Amount: $60
- Select payment method (your card/bank)

**Step 2**: Record THEIR share
- Pay Card / Transfer
- Amount: $40
- From: Same payment source
- To: Other Bank Account → "Friend - [Name]"

**Result**: 
- You paid $100 total
- Your net worth dropped $60 (your actual cost)
- Friend account shows +$40 (they owe you)

#### When THEY pay for you ($30):
- Add Expense
- Amount: $30
- Payment method: Select "Friend - [Name]" account

**Result**: Friend account decreases by $30

#### When they pay you back ($40):
- Pay Card / Transfer
- Amount: $40
- From: "Friend - [Name]"
- To: Your bank account

**Result**: Friend account clears, your bank increases

---

## 🎨 Visual Cheat Sheet

```
┌─────────────────────────────────────────────┐
│           TRANSACTION TYPES                  │
├─────────────────────────────────────────────┤
│                                              │
│  💸 EXPENSE                                  │
│  ├─ Bank    → Balance ⬇️  Net Worth ⬇️      │
│  └─ Card    → Debt ⬆️     Net Worth ⬇️       │
│                                              │
│  💰 INCOME                                   │
│  ├─ Bank    → Balance ⬆️  Net Worth ⬆️      │
│  └─ Card    → Debt ⬇️     Net Worth ⬆️       │
│                                              │
│  🔄 TRANSFER                                 │
│  ├─ Bank→Bank   → Both adjust, Net Worth ➖ │
│  ├─ Bank→Card   → Both ⬇️, Net Worth ➖     │
│  └─ Bank→Friend → Both adjust, Net Worth ➖ │
│                                              │
└─────────────────────────────────────────────┘
```

---

## 🧮 Friend Account Balance

```
┌────────────────────────────────────┐
│   Friend Account Balance           │
├────────────────────────────────────┤
│                                    │
│  +$50  →  They owe YOU $50         │
│   $0   →  All settled up           │
│  -$30  →  YOU owe them $30         │
│                                    │
└────────────────────────────────────┘
```

---

## 🎓 Key Concepts

### Net Worth Changes ONLY With:
- ✅ Expenses (decrease)
- ✅ Income (increase)
- ❌ NOT transfers (just moving money)

### Account Types:
- **Bank** = Asset (higher is better)
- **Credit Card** = Liability (lower is better)
- **Friend Account** = Asset if positive (they owe you)

### Credit Cards:
- Expense WITH card → Debt increases ⬆️
- Paying card bill → Debt decreases ⬇️
- Refund TO card → Debt decreases ⬇️

---

## 🚨 Common Mistakes

### ❌ WRONG: Paying card bill as Expense
```
Add Expense → $500 → Select card
Result: Debt increases to $1000 (bad!)
```

### ✅ CORRECT: Paying card bill as Transfer
```
Pay Card / Transfer → $500 → Bank to Card
Result: Debt decreases to $0 (good!)
```

---

### ❌ WRONG: Friend repayment as Income to card
```
Add Income → $40 → Select card → Category: Gift
Result: Net worth increases by $40 (wrong!)
```

### ✅ CORRECT: Friend repayment as Transfer
```
Pay Card / Transfer → $40 → From: Friend → To: Bank
Result: Net worth unchanged (just collecting debt)
```

---

### ❌ WRONG: Recording full shared expense as yours
```
Add Expense → $100 → Category: Dining Out
Result: Net worth drops $100 (but you only spent $60!)
```

### ✅ CORRECT: Split or use Friend account
```
Option 1: Use split feature ($60 yours, $40 lending)
Option 2: Two transactions ($60 expense, $40 transfer to Friend)
Result: Net worth drops $60 (correct!)
```

---

## 📋 Daily Workflow

### Morning Coffee ($5 with card)
1. Add Expense
2. Amount: 5
3. Category: Food
4. Payment: Your credit card
5. Done!

### Salary Received ($3000)
1. Add Income
2. Amount: 3000
3. Category: Salary
4. Payment: Your bank account
5. Done!

### Pay Card Bill ($500)
1. Pay Card / Transfer
2. Amount: 500
3. From: Checking
4. To: Credit Card → Select card
5. Done!

### Lunch with Friend ($40 split evenly)
1. Add Expense → Amount: 20 → Your card (your half)
2. Pay Card / Transfer → Amount: 20 → Card to "Friend - Alice"
3. Done! (Alice owes you $20)

---

## 🔍 Quick Checks

### Is my net worth correct?
```
Net Worth = All Banks + Friends - All Card Debts

Example:
  Checking: $1000
  Savings: $500
  Friend-Bob: $40 (he owes you)
  Chase Card: $200 (you owe)
  
  Net Worth = ($1000 + $500 + $40) - $200 = $1340
```

### Is my friend balance correct?
- **+$50** = Good! They owe you $50
- **$0** = All settled up
- **-$30** = You owe them $30 (pay them back!)

### Did my card payment work?
After paying $100:
- Bank should be **-$100**
- Card debt should be **-$100**
- Net worth should be **unchanged**

If net worth changed, you did it wrong (probably recorded as expense instead of transfer).

---

## 📱 Navigation

- **Dashboard**: See all accounts and net worth
- **Add Transaction**: Record new transactions
- **Transactions**: View history
- **Accounts**: Manage accounts
- **Cards**: Manage credit cards
- **Reports**: See charts and summaries

---

## 📚 Need More Help?

- **Complete Guide**: See USER_GUIDE.md
- **Visual Examples**: See FLOW_VISUALIZATION.md
- **Technical Details**: See IMPLEMENTATION_SUMMARY.md

---

## 💡 Pro Tips

1. **Be consistent**: Always select the actual payment method you used
2. **Regular checks**: Reconcile balances weekly
3. **Descriptive names**: "Friend - Alice", "Friend - Bob" makes it clear
4. **Categories matter**: Use correct categories for accurate reports
5. **When in doubt**: Transfers move money, Expenses spend it

---

## ⚡ Power User Shortcuts

### Complex Split (3-way dinner)
Total: $90, You: $30, Alice: $30, Bob: $30

1. Expense: $30 (yours)
2. Transfer: $30 to Friend-Alice
3. Transfer: $30 to Friend-Bob

All from same payment source.

### Settling Multiple Debts
Alice owes you $40, you owe Bob $30:

1. When Alice pays: Transfer $40 from Alice to Bank
2. When you pay Bob: Transfer $30 from Bank to Bob

### Cash Tracking
1. Withdraw $200 from ATM: Transfer from Bank to Cash account
2. Spend $5 cash: Expense from Cash account

---

**Remember**: The system is designed to be simple but powerful. Start with basic transactions, then gradually use advanced features as needed.

---

Print this card or keep it handy while using the app! 🎯
