import React, { useState } from "react";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import { makeStyles } from "@material-ui/core/styles";
import { Link as RouterLink } from "react-router-dom";
import { Button } from "@material-ui/core";
import List from "@material-ui/core/List";
import { InfiniteLoader, List as VirtualizedList } from "react-virtualized";

import SkeletonList from "./SkeletonList";
import TransactionItem from "./TransactionItem";
import { TransactionResponseItem } from "../models";
import EmptyList from "./EmptyList";
import { get } from "lodash/fp";

export interface TransactionListProps {
  header: string;
  transactions: TransactionResponseItem[];
  isLoading: Boolean;
  showCreateButton?: Boolean;
  infinite?: Boolean;
  loadNextPage?: Function;
}

const useStyles = makeStyles(theme => ({
  paper: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column"
  }
}));

const TransactionList: React.FC<TransactionListProps> = ({
  header,
  transactions,
  isLoading,
  showCreateButton,
  infinite,
  loadNextPage
}) => {
  const classes = useStyles();
  const [isNextPageLoading, setIsNextPageLoading] = useState(false);

  const rowCount = transactions.length + 1;

  // Only load 1 page of items at a time.
  // Pass an empty callback to InfiniteLoader in case it asks us to load more than once.

  const loadMoreRows = isNextPageLoading
    ? () => {}
    : () =>
        loadNextPage &&
        Promise.resolve("TEST").then(() => {
          console.log("load next page");

          loadNextPage();
        });

  // Every row is loaded except for our loading indicator row.
  //const isRowLoaded = ({ index }: { index: number }) => !hasNextPage || index < transactions.length;
  const isRowLoaded = ({ index }: { index: number }) =>
    index < transactions.length;

  // Render a list item or a loading indicator.
  const rowRenderer = ({
    index,
    key,
    style
  }: {
    index: number;
    key: string;
    style: any;
  }) => {
    if (!isRowLoaded({ index })) {
      return (
        <div key={key} style={style}>
          Loading...
        </div>
      );
    } else {
      const transaction = get(index, transactions);
      return (
        <TransactionItem
          key={key}
          transaction={transaction}
          transactionIndex={index}
        />
      );
    }
  };

  return (
    <Paper className={classes.paper}>
      <Typography component="h2" variant="h6" color="primary" gutterBottom>
        {header}
      </Typography>
      {isLoading && <SkeletonList />}
      {transactions.length > 0 ? (
        infinite ? (
          <InfiniteLoader
            isRowLoaded={isRowLoaded}
            // @ts-ignore
            loadMoreRows={loadMoreRows}
            rowCount={rowCount}
          >
            {({ onRowsRendered, registerChild }) => (
              <VirtualizedList
                data-test="transaction-list"
                ref={registerChild}
                onRowsRendered={onRowsRendered}
                rowRenderer={rowRenderer}
                height={1000}
                rowHeight={165}
                rowCount={transactions.length}
                width={800}
              />
            )}
          </InfiniteLoader>
        ) : (
          <List data-test="transaction-list">
            {transactions.map(
              (transaction: TransactionResponseItem, index: number) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  transactionIndex={index}
                />
              )
            )}
          </List>
        )
      ) : (
        <EmptyList entity="Transactions">
          {showCreateButton && (
            <Button
              data-test="transaction-list-empty-create-transaction-button"
              variant="contained"
              color="primary"
              component={RouterLink}
              to="/transaction/new"
            >
              Create A Transaction
            </Button>
          )}
        </EmptyList>
      )}
    </Paper>
  );
};

export default TransactionList;
