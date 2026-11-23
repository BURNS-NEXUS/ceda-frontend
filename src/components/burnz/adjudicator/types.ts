/** An application assigned to the signed-in adjudicator. */
export type AdjudicationCase = {
  taskId: string;
  applicationId: string;
  title: string;
  businessNature: string;
  companyNo: string;
  location: string;
  state: string;
  taskStatus: string;
};
