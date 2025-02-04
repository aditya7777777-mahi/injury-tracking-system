import { gql } from "@apollo/client";

export const typeDefs = gql`
  scalar DateTime

  type Report {
    id: ID!
    userId: String!
    reporterName: String!
    injuryDateTime: DateTime!
    status: String!
    injuries: [Injury!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Injury {
    id: ID!
    location: String!
    bodyPart: String!
    reportId: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CreateReportInput {
    reporterName: String!
    injuryDateTime: DateTime!
    injuries: [CreateInjuryInput!]!
  }

  input CreateInjuryInput {
    location: String!
    bodyPart: String!
  }

  type AnalyticsSummary {
    totalReports: Int!
    totalInjuries: Int!
    bodyPartDistribution: [BodyPartStat!]!
    monthlyReports: [MonthlyStats!]!
  }

  type BodyPartStat {
    bodyPart: String!
    count: Int!
    percentage: Float!
  }

  type MonthlyStats {
    month: String!
    count: Int!
  }

  type Query {
    reports: [Report!]!
    report(id: ID!): Report
    analytics: AnalyticsSummary!
  }

  type Payload {
    success: Boolean!
    message: String!
  }

  type Mutation {
    createReport(input: CreateReportInput!): Payload!
    updateReport(id: ID!, input: CreateReportInput!): Payload!
    deleteReport(id: ID!): Payload!
  }
`;
