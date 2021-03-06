import { User, Transaction } from "../../../src/models";

type NewTransactionCtx = {
  transactionRequest?: Transaction;
  authenticatedUser?: User;
};

describe("Transaction View", function () {
  const ctx: NewTransactionCtx = {};

  beforeEach(function () {
    cy.task("db:seed");

    cy.server();
    cy.route("GET", "/transactions").as("personalTransactions");
    cy.route("GET", "/transactions/public").as("publicTransactions");
    cy.route("GET", "/transactions/*").as("getTransaction");
    cy.route("PATCH", "/transactions/*").as("updateTransaction");

    cy.route("GET", "/checkAuth").as("userProfile");
    cy.route("GET", "/notifications").as("getNotifications");
    cy.route("GET", "/bankAccounts").as("getBankAccounts");

    cy.task("find:testData", { entity: "users" }).then((user: User) => {
      ctx.authenticatedUser = user;

      cy.loginByXstate(ctx.authenticatedUser.username);

      cy.task("find:testData", {
        entity: "transactions",
        findAttrs: {
          receiverId: ctx.authenticatedUser.id,
          status: "pending",
          requestStatus: "pending",
          requestResolvedAt: "",
        },
      }).then((transaction: Transaction) => {
        ctx.transactionRequest = transaction;
      });
    });

    cy.getBySel("nav-personal-tab").click();
    cy.wait("@personalTransactions");
  });

  it("transactions navigation tabs are hidden on a transaction view page", function () {
    cy.getBySelLike("transaction-item").first().click();

    cy.location("pathname").should("include", "/transaction");
    cy.getBySel("nav-transaction-tabs").should("not.be.visible");
  });

  it("likes a transaction", function () {
    cy.getBySelLike("transaction-item").first().click();
    cy.wait("@getTransaction");

    cy.getBySelLike("like-button").click();
    cy.getBySelLike("like-count").should("contain", 1);
    cy.getBySelLike("like-button").should("be.disabled");
  });

  it("comments on a transaction", function () {
    cy.getBySelLike("transaction-item").first().click();
    cy.wait("@getTransaction");

    const comments = ["Thank you!", "Appreciate it."];

    comments.forEach((comment, index) => {
      cy.getBySelLike("comment-input").type(`${comment}{enter}`);
      cy.getBySelLike("comments-list").children().eq(index).contains(comment);
    });

    cy.getBySelLike("comments-list").children().should("have.length", comments.length);
  });

  it("accepts a transaction request", function () {
    cy.getBySelLike("transaction-item").eq(4).click();
    cy.wait("@getTransaction");

    cy.getBySelLike("accept-request").click();
    cy.wait("@updateTransaction").should("have.property", "status", 204);
  });

  it("rejects a transaction request", function () {
    cy.getBySelLike("transaction-item").eq(4).click();
    cy.wait("@getTransaction");

    cy.getBySelLike("reject-request").click();
    cy.wait("@updateTransaction").should("have.property", "status", 204);
  });

  it("does not display accept/reject buttons on completed request", function () {
    cy.task("find:testData", {
      entity: "transactions",
      findAttrs: {
        receiverId: ctx.authenticatedUser!.id,
        status: "complete",
        requestStatus: "accepted",
      },
    }).then((transactionRequest) => {
      cy.visit(`/transaction/${transactionRequest!.id}`);

      cy.getBySel("transaction-accept-request").should("not.be.visible");
      cy.getBySel("transaction-reject-request").should("not.be.visible");
    });
  });
});
