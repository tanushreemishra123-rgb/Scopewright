import type { Cloud } from "./types";

export const CLOUDS: Record<Cloud, string> = {
  aws: "Amazon Web Services",
  azure: "Microsoft Azure",
  gcp: "Google Cloud Platform",
};

// logical component type -> cloud-specific managed service.
// Keeps the architecture platform-specific rather than a generic tech list.
export const SERVICE_MAP: Record<string, Record<Cloud, string>> = {
  web:      { aws: "CloudFront + S3 (static hosting)", azure: "Azure Static Web Apps + Front Door", gcp: "Cloud CDN + Cloud Storage" },
  api:      { aws: "API Gateway + ECS Fargate", azure: "API Management + Azure Container Apps", gcp: "API Gateway + Cloud Run" },
  compute:  { aws: "ECS Fargate / AWS Lambda", azure: "Azure Container Apps / Functions", gcp: "Cloud Run / Cloud Functions" },
  rdb:      { aws: "Amazon RDS for PostgreSQL", azure: "Azure Database for PostgreSQL", gcp: "Cloud SQL for PostgreSQL" },
  cache:    { aws: "Amazon ElastiCache (Redis)", azure: "Azure Cache for Redis", gcp: "Memorystore for Redis" },
  nosql:    { aws: "Amazon DynamoDB", azure: "Azure Cosmos DB", gcp: "Firestore" },
  storage:  { aws: "Amazon S3", azure: "Azure Blob Storage", gcp: "Cloud Storage" },
  backup:   { aws: "AWS Backup + cross-region S3 replication", azure: "Azure Backup + geo-redundant storage (GRS)", gcp: "Backup and DR Service + multi-region Cloud Storage" },
  events:   { aws: "Amazon EventBridge + SQS/SNS", azure: "Azure Event Grid + Service Bus", gcp: "Pub/Sub + Eventarc" },
  identity: { aws: "Amazon Cognito", azure: "Microsoft Entra ID (External ID)", gcp: "Identity Platform" },
  integ:    { aws: "AWS Step Functions + AppFlow", azure: "Azure Logic Apps + Integration Services", gcp: "Cloud Workflows + Apigee" },
  ai:       { aws: "Amazon Bedrock", azure: "Azure OpenAI in AI Foundry", gcp: "Vertex AI" },
  vector:   { aws: "Amazon OpenSearch (kNN)", azure: "Azure AI Search (vector)", gcp: "Vertex AI Vector Search" },
  obs:      { aws: "Amazon CloudWatch + X-Ray", azure: "Azure Monitor + App Insights", gcp: "Cloud Monitoring + Trace" },
  security: { aws: "AWS KMS + WAF + Secrets Manager", azure: "Azure Key Vault + WAF", gcp: "Cloud KMS + Cloud Armor" },
  cicd:     { aws: "CodePipeline + CodeBuild", azure: "Azure DevOps Pipelines", gcp: "Cloud Build + Cloud Deploy" },
};
