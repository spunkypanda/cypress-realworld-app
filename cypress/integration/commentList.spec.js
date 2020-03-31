import React from 'react';
import CommentList from '../../src/components/CommentList';
import { createFakeComment } from '../../scripts/generateFakeComments';

describe('CommentList', () => {
  it('displays a comment', () => {
    const comment = createFakeComment();
    cy.mount(<CommentList key={comment.id} comment={comment} />)
    cy.contains(comment.content)
  })
})