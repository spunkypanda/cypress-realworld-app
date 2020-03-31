import React from 'react';
import CommentListItem from '../../src/components/CommentListItem';
import { createFakeComment } from '../../scripts/generateFakeComments';

describe('CommentListItem', () => {
  it('displays a comment', () => {
    const comment = createFakeComment();
    cy.mount(<CommentListItem key={comment.id} comment={comment} />)
    cy.contains(comment.content)
  })
})