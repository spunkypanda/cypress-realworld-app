// check this file using TypeScript if available
// @ts-check

describe("Notifications", function() {
  before(function() {
    cy.fixture("users").as("users");
    cy.get("@users").then(users => {
      cy.login(this.users[0].username);
    });
  });
  beforeEach(function() {
    cy.task("db:seed");
    // TODO: Highlight this use case
    Cypress.Cookies.preserveOnce("connect.sid");
    cy.server();

    cy.route("GET", "http://localhost:3001/notifications").as(
      "getNotifications"
    );

    cy.route("PATCH", "http://localhost:3001/notifications/*").as(
      "updateNotification"
    );
  });
  after(function() {
    cy.task("db:seed");
  });

  it("renders a notifications list", function() {
    cy.getTest("nav-top-notifications-count").click();
    cy.wait("@getNotifications");
    //cy.wait(2000);

    cy.getTestLike("notification-mark-read")
      .eq(3)
      .click();

    cy.getTestLike("notification-list-item").should("have.length", 5);
  });

  /*
    // renders the notifications badge with count
    cy.getTest("nav-top-notifications-count").should("contain", 6);

    // renders the notifications list with count
    cy.getTestLike("notification-list-item").should("have.length", 6);

    // renders a like notification
    cy.getTestLike("notification-list-item").should("contain", "liked");
    cy.getTestLike("notification-list-item").should("contain", "commented");
    cy.getTestLike("notification-list-item").should("contain", "requested");
    cy.getTestLike("notification-list-item").should("contain", "received");
    */

  // marks a notification as read; updates notification counter badge"

  //cy.wait("@updateNotification");
  //cy.wait("@notifications");

  //cy.getTestLike("notification-list-item").should("have.length", 5);
  /*
  it.skip("renders an empty notifications state", function() {
    // TODO: does not work per https://github.com/cypress-io/cypress/issues/3890
    // Overwrite default notifications response
    // cy.route("GET", "/notifications", []).as("notifications");
    cy.getTest("nav-top-notifications-count").click();
    cy.getTest("notification-list").should("not.be.visible");
    cy.getTest("empty-list-header").should("contain", "No Notifications");
  });
  */
});
