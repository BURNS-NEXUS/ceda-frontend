/** A claimed evaluation, shown to the reviewer with human-readable details. */
export type AssignedReview = {
  taskId: string;
  applicationId: string;
  title: string;
  businessNature: string;
  companyNo: string;
  state: string;
};
