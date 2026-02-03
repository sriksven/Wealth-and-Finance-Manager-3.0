# Wealth & Finance Manager - Complete User Guide

This guide explains how to properly track all your financial transactions according to the correct accounting principles.

---

## Table of Contents
1. [Core Concepts](#core-concepts)
2. [Simple Transactions](#simple-transactions)
3. [Advanced Friend Tracking (Splitwise Pattern)](#advanced-friend-tracking)
4. [Common Scenarios](#common-scenarios)
5. [Troubleshooting](#troubleshooting)

---

## Core Concepts

### The Three Managers
Your money is managed by three systems working together:

1. **TransactionContext** (The Manager)
   - Records all events (expenses, income, transfers)
   - Tells the other systems to update balances

2. **FinanceContext** (Assets)
   - Manages Bank Accounts, Cash, and Friend Accounts
   - Positive balance = You have money or someone owes you

3. **CardContext** (Liabilities)
   - Manages Credit Cards
   - Positive balance = You owe money (debt)

### Account Types

**Asset Accounts** (FinanceContext):
- Bank Accounts (Checking, Savings)
- Cash
- Friend Accounts (for tracking who owes what)

**Credit Cards** (CardContext):
- Credit Cards (debt increases when you spend)
- Debit Cards (linked to bank account)

---

## Simple Transactions

### 1. Recording an Expense

**Scenario**: You buy groceries for $50 with your credit card.

**Steps**:
1. Go to "Add Transaction" → "Add Expense"
2. Amount: `50`
3. Category: `Groceries`
4. Description: `Weekly groceries`
5. Payment Method: Select your credit card

**What happens**:
- ✅ Credit card debt increases by $50
- ✅ Net Worth decreases by $50

---

### 2. Recording Income

**Scenario**: You receive your $3000 salary.

**Steps**:
1. Go to "Add Transaction" → "Add Income"
2. Amount: `3000`
3. Category: `Salary`
4. Source: `Employer`
5. Payment Method: Select your bank account

**What happens**:
- ✅ Bank balance increases by $3000
- ✅ Net Worth increases by $3000

---

### 3. Paying a Credit Card Bill

**Scenario**: You pay $500 from your checking account to your credit card.

**Steps**:
1. Go to "Add Transaction" → "Pay Card / Transfer"
2. Amount: `500`
3. From: Select your checking account
4. To: Select "Credit Card Bill"
5. Select the credit card to pay

**What happens**:
- ✅ Bank balance decreases by $500
- ✅ Credit card debt decreases by $500
- ✅ Net Worth stays the same (money just moved)

---

### 4. Bank to Bank Transfer

**Scenario**: You move $1000 from Checking to Savings.

**Steps**:
1. Go to "Add Transaction" → "Pay Card / Transfer"
2. Amount: `1000`
3. From: Select your checking account
4. To: Select "Other Bank Account"
5. Select your savings account

**What happens**:
- ✅ Checking balance decreases by $1000
- ✅ Savings balance increases by $1000
- ✅ Net Worth stays the same

---

## Advanced Friend Tracking

### When to Use This
Use this pattern when you:
- Regularly share expenses with roommates
- Want to track a running balance (like Splitwise)
- Need to know "who owes who" at any time

### Setup: Create a Friend Account

1. Go to "Add Account"
2. Name: `Friend - Bob`
3. Type: `Asset`
4. Category: `Cash and Cash Equivalents`
5. Initial Balance: `0`

**Understanding the Balance**:
- **Positive Balance**: Bob owes YOU money
- **Negative Balance**: YOU owe Bob money
- **Zero Balance**: All settled up

---

### Scenario A: You Pay for Shared Dinner

**Setup**: Dinner costs $100. You eat $60 worth, Bob eats $40 worth. You pay the full $100 with your credit card.

**Correct Approach**:
You need to record TWO transactions:

**Transaction 1 - Your Actual Expense**:
1. Go to "Add Expense"
2. Amount: `60`
3. Category: `Dining Out`
4. Description: `My share of dinner`
5. Payment: Your credit card

**Transaction 2 - Transfer to Bob's Account**:
1. Go to "Pay Card / Transfer"
2. Amount: `40`
3. From: Your credit card
4. To: Select "Other Bank Account" → `Friend - Bob`
5. Description: `Bob's share of dinner`

**Result**:
- ✅ Your credit card debt increases by $100 (total paid)
- ✅ Your expense is recorded as $60 (your actual cost)
- ✅ Friend - Bob balance shows +$40 (Bob owes you $40)
- ✅ Your Net Worth decreased by $60 (correct!)

---

### Scenario B: Bob Pays for Your Uber

**Setup**: Bob pays $30 for your Uber ride.

**Steps**:
1. Go to "Add Expense"
2. Amount: `30`
3. Category: `Transport`
4. Description: `Uber ride (Bob paid)`
5. Payment: Select `Friend - Bob` account

**Result**:
- ✅ Friend - Bob balance decreases by $30
- ✅ If Bob previously owed you $40, he now owes $10
- ✅ Your Net Worth decreased by $30 (you still spent it)

---

### Scenario C: Settlement

**Setup**: Bob pays you back the remaining $10.

**Steps**:
1. Go to "Pay Card / Transfer"
2. Amount: `10`
3. From: `Friend - Bob`
4. To: Your bank account
5. Description: `Settlement from Bob`

**Result**:
- ✅ Friend - Bob balance becomes $0 (settled!)
- ✅ Your bank balance increases by $10
- ✅ Net Worth stays the same (just collecting money owed)

---

## Common Scenarios

### Split Expense (Simple Method)

If you don't need ongoing tracking, use the split feature:

1. Go to "Add Expense"
2. Enter the total amount: `100`
3. Check "Split this expense?"
4. Enter your share: `60`
5. The system will create two entries:
   - Your actual expense ($60)
   - A "Lending / Reimbursable" entry ($40)

When your friend pays you back:
1. Go to "Add Income"
2. Amount: `40`
3. Category: `Reimbursement`

---

### Cash Transactions

For cash expenses where you don't track a specific cash account:
1. Select "Cash" as the payment method
2. This is treated as a separate cash pool

To move money from bank to cash:
1. Use "Pay Card / Transfer"
2. From: Your bank account
3. To: Create a "Cash" account first

---

### Credit Card Refunds

**Scenario**: Store refunds $50 to your credit card.

**Steps**:
1. Go to "Add Income"
2. Amount: `50`
3. Category: `Other Income`
4. Description: `Refund from Store`
5. Payment: Your credit card

**Result**:
- ✅ Credit card debt decreases by $50
- ✅ Net Worth increases by $50

---

## Troubleshooting

### My balances don't match reality

**Check**:
1. Did you enter all transactions?
2. Did you use the correct account for each transaction?
3. For credit cards: Did you accidentally select it as income instead of expense?

**Fix**:
- Go to "Record Balances" to manually set the correct current balance

---

### I paid for a friend but my Net Worth dropped too much

**Problem**: You probably recorded the full amount as your expense.

**Solution**: 
- Use the Friend Account pattern (see Scenario A above)
- Or use the split expense feature
- Your Net Worth should only drop by YOUR share

---

### Card debt is increasing but I'm not spending

**Check**: 
- Did you record an expense with the card as payment method?
- Card expenses INCREASE debt
- Card income/refunds DECREASE debt

---

### Friend balance is backwards

**Remember**:
- Positive balance = They owe YOU
- Negative balance = YOU owe them

**To fix backwards entry**:
- Delete the wrong transaction
- Re-record it correctly

---

## Quick Reference Matrix

| Action | Where | From Account | To Account | Effect |
|--------|-------|--------------|------------|--------|
| Buy coffee with card | Expense | Credit Card | - | Card debt ⬆️, Net Worth ⬇️ |
| Receive salary | Income | - | Bank | Bank ⬆️, Net Worth ⬆️ |
| Pay card bill | Transfer | Bank | Card | Bank ⬇️, Card debt ⬇️, Net Worth = |
| Transfer to savings | Transfer | Checking | Savings | Checking ⬇️, Savings ⬆️, Net Worth = |
| Lend money to friend | Transfer | Bank/Card | Friend Account | Money ⬇️, Friend balance ⬆️ |
| Friend pays for you | Expense | Friend Account | - | Friend balance ⬇️, Net Worth ⬇️ |
| Friend pays you back | Transfer | Friend Account | Bank | Friend balance ⬇️, Bank ⬆️ |

---

## Tips for Success

1. **Be Consistent**: Always record transactions the same way
2. **Use Descriptive Names**: "Friend - Alice", "Friend - Bob" makes it clear
3. **Regular Reconciliation**: Check your balances weekly
4. **Categories Matter**: Use correct categories for accurate reports
5. **Transfers Don't Change Net Worth**: Only income and expenses do

---

## Need Help?

If something doesn't work as expected:
1. Check this guide for the correct pattern
2. Verify you selected the right account type
3. Remember: The system follows double-entry accounting rules

The golden rule: **Every dollar has to come from somewhere and go somewhere!**
