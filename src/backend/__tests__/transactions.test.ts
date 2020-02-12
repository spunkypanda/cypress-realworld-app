import { map } from "lodash/fp";
import {
  seedDatabase,
  getTransactionsForUserByObj,
  getTransactionsForUserContacts,
  getAllUsers,
  getAllTransactions,
  getAllPublicTransactions,
  getBankAccountsByUserId,
  createTransaction,
  getTransactionsByUserId,
  updateTransactionById,
  getTransactionById,
  getPublicTransactionsDefaultSort,
  getUserById,
  getBankTransferByTransactionId
} from "../database";

import {
  User,
  Transaction,
  TransactionRequestStatus,
  DefaultPrivacyLevel,
  BankTransferType,
  TransactionPayload,
  TransactionStatus
} from "../../models";
import { getFakeAmount } from "../../utils/transactionUtils";

describe("Transactions", () => {
  afterEach(() => {
    seedDatabase();
  });
  afterAll(() => {
    seedDatabase();
  });

  it("should retrieve a list of all transactions", () => {
    expect(getAllTransactions().length).toBe(30);
  });

  it("should retrieve a list of all public transactions", () => {
    expect(getAllPublicTransactions().length).toBe(10);
  });

  it("should retrieve a list of transactions for a user (user is receiver)", () => {
    const userToLookup: User = getAllUsers()[0];

    const result: Transaction[] = getTransactionsForUserByObj(userToLookup.id, {
      status: "complete"
    });
    expect(result[0].receiverId).toBe(userToLookup.id);
  });

  it("should retrieve a list of transactions for a user (user is sender)", () => {
    const userToLookup: User = getAllUsers()[0];

    const result: Transaction[] = getTransactionsForUserByObj(userToLookup.id);
    expect(result.pop()!.senderId).toBe(userToLookup.id);
  });

  it("should retrieve a list of transactions for a users contacts", () => {
    const userToLookup: User = getAllUsers()[0];
    const result: Transaction[] = getTransactionsForUserContacts(
      userToLookup.id
    );
    expect(result.length).toBe(17);
  });

  it("should retrieve a list of transactions for a users contacts - status 'incomplete'", () => {
    const userToLookup: User = getAllUsers()[0];
    const result: Transaction[] = getTransactionsForUserContacts(
      userToLookup.id,
      { status: "incomplete" }
    );
    expect(result.length).toBe(3);
  });

  it("should retrieve a list of public transactions, default sort", () => {
    const user: User = getAllUsers()[0];
    const contactsTransactions: Transaction[] = getTransactionsForUserContacts(
      user.id
    );
    expect(contactsTransactions.length).toBe(17);

    const response = getPublicTransactionsDefaultSort(user.id);

    expect(response.contacts.length).toBe(17);
    expect(response.public.length).toBe(3);

    const ids = map("id", contactsTransactions);
    expect(ids).toContain(response.contacts[9].id);
  });

  it("should create a payment", () => {
    const sender: User = getAllUsers()[0];
    const receiver: User = getAllUsers()[1];
    const senderBankAccount = getBankAccountsByUserId(sender.id)[0];

    const paymentDetails: TransactionPayload = {
      source: senderBankAccount.id!,
      senderId: sender.id,
      receiverId: receiver.id,
      description: `Payment: ${sender.id} to ${receiver.id}`,
      amount: getFakeAmount(),
      privacyLevel: DefaultPrivacyLevel.public,
      status: TransactionStatus.pending
    };

    const result = createTransaction(sender.id, "payment", paymentDetails);
    expect(result.id).toBeDefined();
    expect(result.status).toEqual("pending");
    expect(result.requestStatus).not.toBeDefined();
  });

  it("should create a request", () => {
    const sender: User = getAllUsers()[0];
    const receiver: User = getAllUsers()[1];
    const senderBankAccount = getBankAccountsByUserId(sender.id)[0];

    const requestDetails: TransactionPayload = {
      source: senderBankAccount.id!,
      senderId: sender.id,
      receiverId: receiver.id,
      description: `Request: ${sender.id} to ${receiver.id}`,
      amount: getFakeAmount(),
      privacyLevel: DefaultPrivacyLevel.public,
      status: TransactionStatus.pending
    };

    const result = createTransaction(sender.id, "request", requestDetails);
    expect(result.id).toBeDefined();
    expect(result.status).toEqual("pending");
    expect(result.requestStatus).toEqual("pending");
  });

  it("should create a payment and find it in the personal transactions", () => {
    const sender: User = getAllUsers()[0];
    const receiver: User = getAllUsers()[1];
    const senderBankAccount = getBankAccountsByUserId(sender.id)[0];

    const paymentDetails: TransactionPayload = {
      source: senderBankAccount.id!,
      senderId: sender.id,
      receiverId: receiver.id,
      description: `Payment: ${sender.id} to ${receiver.id}`,
      amount: getFakeAmount(),
      privacyLevel: DefaultPrivacyLevel.private,
      status: TransactionStatus.pending
    };

    const payment = createTransaction(sender.id, "payment", paymentDetails);
    expect(payment.id).toBeDefined();

    const personalTransactions: Transaction[] = getTransactionsForUserByObj(
      sender.id
    );
    const ids = map("id", personalTransactions);
    expect(ids).toContain(payment.id);
  });

  it("should update a transaction", () => {
    const user: User = getAllUsers()[0];

    const transactions = getTransactionsByUserId(user.id);
    expect(transactions.length).toBe(6);

    const transaction = transactions[0];
    expect(transaction.requestStatus).not.toEqual("rejected");

    const edits: Partial<Transaction> = {
      requestStatus: TransactionRequestStatus.rejected
    };
    updateTransactionById(user.id, transaction.id, edits);

    const updatedTransaction = getTransactionById(transaction.id);
    expect(updatedTransaction.requestStatus).toEqual("rejected");
  });

  it("should add additional fields (e.g. retreiverName, senderName, etc) to a list of transactions for a user for API response", () => {
    const userToLookup: User = getAllUsers()[0];

    const result = getPublicTransactionsDefaultSort(userToLookup.id);

    const transaction = result.public[0];
    const { receiverId, senderId, receiverName, senderName } = transaction;
    const receiver = getUserById(receiverId);
    const sender = getUserById(senderId);

    expect(receiverName).toBe(`${receiver.firstName} ${receiver.lastName}`);
    expect(senderName).toBe(`${sender.firstName} ${sender.lastName}`);
    expect(transaction.likes).toBeDefined();
    expect(transaction.comments).toBeDefined();
  });

  it("should create a payment and withdrawal (bank transfer) for remaining balance", () => {
    const sender: User = getAllUsers()[0];
    const receiver: User = getAllUsers()[1];
    const senderBankAccount = getBankAccountsByUserId(sender.id)[0];

    const paymentDetails: TransactionPayload = {
      source: senderBankAccount.id!,
      senderId: sender.id,
      receiverId: receiver.id,
      description: `Payment: ${sender.id} to ${receiver.id}`,
      amount: 100000,
      privacyLevel: DefaultPrivacyLevel.public,
      status: TransactionStatus.pending
    };

    const transaction = createTransaction(sender.id, "payment", paymentDetails);
    expect(transaction.id).toBeDefined();
    expect(transaction.status).toEqual("pending");
    expect(transaction.requestStatus).not.toBeDefined();

    const updatedSender: User = getAllUsers()[0];
    expect(updatedSender.balance).toBe(0);

    const withdrawal = getBankTransferByTransactionId(transaction.id);
    expect(withdrawal.type).toBe(BankTransferType.withdrawal);
    expect(withdrawal.amount).toBe(45000);

    // second transaction - $500
    const secondPaymentDetails: TransactionPayload = {
      source: senderBankAccount.id!,
      senderId: sender.id,
      receiverId: receiver.id,
      description: `Payment: ${sender.id} to ${receiver.id}`,
      amount: 50000,
      privacyLevel: DefaultPrivacyLevel.public,
      status: TransactionStatus.pending
    };
    const secondTransaction = createTransaction(
      sender.id,
      "payment",
      secondPaymentDetails
    );
    expect(secondTransaction.id).toBeDefined();
    expect(secondTransaction.status).toEqual("pending");
    expect(secondTransaction.requestStatus).not.toBeDefined();

    const secondUpdatedSender: User = getAllUsers()[0];
    expect(secondUpdatedSender.balance).toBe(0);

    const secondWithdrawal = getBankTransferByTransactionId(
      secondTransaction.id
    );
    expect(secondWithdrawal.type).toBe(BankTransferType.withdrawal);
    expect(secondWithdrawal.amount).toBe(50000);
  });

  it("should create a deposit (bank transfer) from pay app balance", () => {
    const sender: User = getAllUsers()[0];
    //const senderBankAccount = getBankAccountsByUserId(sender.id)[0];

    // transactionIsBankDeposit()
    // if source is empty and sender and receiver id's are the same === deposit transaction
    const paymentDetails: TransactionPayload = {
      source: "",
      senderId: sender.id,
      receiverId: sender.id, // UserId is receiver as well as sender
      description: "Transfer Pay App Balance to Bank Account",
      amount: 5000,
      privacyLevel: DefaultPrivacyLevel.private,
      status: TransactionStatus.pending
    };

    const transaction = createTransaction(
      sender.id,
      "transferDeposit",
      paymentDetails
    );
    expect(transaction.id).toBeDefined();
    expect(transaction.status).toEqual("pending");
    expect(transaction.requestStatus).not.toBeDefined();
  });
});
