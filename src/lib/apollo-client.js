'use client';
import { ApolloClient, InMemoryCache, ApolloProvider, gql } from '@apollo/client';
import { useMemo } from 'react';

function createApolloClient() {
  return new ApolloClient({
    uri: '/api/graphql',
    cache: new InMemoryCache(),
    ssrMode: typeof window === 'undefined',
    credentials: 'same-origin',
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'no-cache', 
      },
      query: {
        fetchPolicy: 'no-cache', 
      },
    },
  });
}

export function useApollo() {
  const client = useMemo(() => createApolloClient(), []);
  return client;
}

export const REPORTS_QUERY = gql`
  query GetReports {
    reports {
      id
      reporterName
      injuryDateTime
      status
      createdAt
      injuries {
        id
        location
      }
    }
  }
`;

export const CREATE_REPORT = gql`
  mutation CreateReport($input: CreateReportInput!) {
    createReport(input: $input) {
      success
      message
    }
  }
`;

export const GET_REPORT = gql`
  query GetReport($id: ID!) {
    report(id: $id) {
      id
      reporterName
      injuryDateTime
      status
      createdAt
      updatedAt
      injuries {
        id
        location
        bodyPart
      }
    }
  }
`;

export const UPDATE_REPORT = gql`
  mutation UpdateReport($id: ID!, $input: CreateReportInput!) {
    updateReport(id: $id, input: $input) {
      success
      message
    }
  }
`;

export const DELETE_REPORT = gql`
  mutation DeleteReport($id: ID!) {
    deleteReport(id: $id) {
      success
      message
    }
  }
`;

export const GET_ANALYTICS = gql`
  query GetAnalytics {
    analytics {
      totalReports
      totalInjuries
      bodyPartDistribution {
        bodyPart
        count
        percentage
      }
      monthlyReports {
        month
        count
      }
    }
  }
`;
