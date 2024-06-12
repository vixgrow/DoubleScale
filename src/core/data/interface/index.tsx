export interface CommonState {
  darkMode: boolean;
}
export interface RootState {
  headerCollapse: boolean; // Assuming headerCollapse is a boolean value
}
export interface TableData {
  questions: string;
  category: string;
  answers: string;
  created_at: string;
  name: string;
  type: string;
  progress: string;
  members: string;
  startDate: string;
  endDate: string;
  lead_name: string;
  company_address: string;
  pages: string;
  page_slug: string;
  phone: string;
  company_name: string;
  location: string;
  Action: string;
  rating: string;
  owner: string;
  created: string;
  leadName: string;
  companyName: string;
  source: string;
  leadOwner: string;
  createdDate: string;
  leadStatus: string;
  email: string;
  Stage: string;
  Deal_Value: string;
  close_date: string;
  Probability: string;
  Status: string;
  created_date: string;
  Deal_Name: string;
  industry: string;
  company: string;
  wonDeals: string;
  lostDeals: string;
  dateCreated: string;
  budgetValue: string;
  currentlySpend: string;
  pipelineStage: string;
  client: string;
  priority: string;
  dueDate: string;
  taskName: string;
  assignedTo: string;
  status: string;
  createdAt: string;
  title: string;
  roleName: string;
  amount: string;
  date: string;
  paymentType: string;
  createdat:string;
  no_deal: string;
  deal_value: string;
  stage: string;
  dealValue: string;
  start_date: string;
  end_date: string;
  piority:string;
  customer_no:string;
  customer_name:string;
  content: string;
  userName: string;
}
export interface status {
  text: string;
  status: string;
}

export interface DatatableProps {
  columns: any[]; // You can replace `any[]` with the specific type of columns you expect
  dataSource: any[]; // You can replace `any[]` with the specific type of dataSource you expect
}

export interface CountriesData {
  name: string;
  countryName: string;
  countryId: string;
  startDate: string;
  endDate: string;
  countryCode: string;
}
export interface DealsInterface {
  dealName: string;
  stage: string;
  dealValue: string;
  tag1: string;
  closeDate: string;
  crearedDate: string;
  owner: string;
  status: string;
  probability: string;
}
export interface DeleteRequestInterface {
  id: number;
  si_no: string;
  select: string;
  customer_name: string;
  customer_image: string;
  customer_no: string;
  created: string;
  delete_request: string;
  Action: string;
}
export interface AppState {
  mouseOverSidebar: string;
}