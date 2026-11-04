import { createBrowserRouter } from "react-router-dom";
import { DashboardPage } from "../../pages/DashboardPage";
import { AdAccountsPage } from "../../pages/AdAccountsPage";
import { BudgetAlertsPage } from "../../pages/BudgetAlertsPage";
import { AdSetsPage } from "../../pages/AdSetsPage";
import { AdSetDetailPage } from "../../pages/AdSetDetailPage";
import { AdsDetailPage } from "../../pages/AdsDetailPage";
import { BrandsPage } from "../../pages/BrandsPage";
import { BrandDetailPage } from "../../pages/BrandDetailPage";
import { ConfigPage } from "../../pages/ConfigPage";
import { SystemLogsPage } from "../../pages/SystemLogsPage";
import LoginPage from "../../pages/LoginPage";
import ProtectedRoute from "./router";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import BusinessManagerPage from "../../pages/BusinessManager/BusinessManager";
import CreateBusinessManagerPage from "../../pages/BusinessManager/CreateBusinessManager";
import EditBusinessManagerPage from "../../pages/BusinessManager/EditBusinessManager";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: "budgets-alerts",
            element: <BudgetAlertsPage />,
          },
          {
            path: "accounts",
            element: <AdAccountsPage />,
          },
          {
            path: "adsets",
            element: <AdSetsPage />,
          },
          {
            path: "adsets/:id",
            element: <AdSetDetailPage />,
          },
          {
            path: "ads-detail",
            element: <AdsDetailPage />,
          },
          {
            path: "brands",
            element: <BrandsPage />,
          },
          {
            path: "brands/:id",
            element: <BrandDetailPage />,
          },
          {
            path: "business-managers",
            element: <BusinessManagerPage />,
          },
          {
            path: "business-managers/create",
            element: <CreateBusinessManagerPage />,
          },
          {
            path: "business-managers/:id/edit",
            element: <EditBusinessManagerPage />,
          },
          {
            path: "config",
            element: <ConfigPage />,
          },
          {
            path: "system-logs",
            element: <SystemLogsPage />,
          },
        ],
      },
    ],
  },
]);
