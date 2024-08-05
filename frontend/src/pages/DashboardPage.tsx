import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useAlert from "@/features/alert/hooks/useAlert";
import { getSeverityColor, getStatusColor } from "@/features/alert/utils/color";
import { Severity } from "industrial-knowledge-transfer-by-genai";
import { DashboardAlert } from "@/features/alert/types";
import { LuCheck, LuChevronRight, LuCoffee, LuFlame } from "react-icons/lu";
import { twMerge } from "tailwind-merge";
import { useTranslation } from "react-i18next";

type TabProps = {
  id: string;
  name: string;
};

type SeverityCardProps = {
  severity: Severity;
  severityColor: string;
  nums: number;
};

function AlertPage() {
  const { t } = useTranslation();

  const tabItems = useMemo(
    () => [
      { id: "OPEN", name: t("alertDashboard.status.open") },
      { id: "CLOSED", name: t("alertDashboard.status.closed") },
      { id: "ALL", name: t("alertDashboard.status.all") },
    ],
    [t]
  );

  const navigate = useNavigate();
  const { alerts } = useAlert();
  const [filteredData, setFilteredData] = useState<DashboardAlert[]>([]);
  const [selectedTab, setSelectedTab] = useState<TabProps>(tabItems[0]);
  const [severityFilter, setSeverityFilter] = useState<Severity | null>(null);
  const [sevs, setSevs] = useState<SeverityCardProps[]>([]);

  useEffect(() => {
    if (!selectedTab) return;
    // debug purpose
    // console.log("alerts:" + JSON.str
    const updatedAlerts = alerts.map((item) => ({
      ...item,
      severityColor: getSeverityColor(item.severity),
      statusColor: getStatusColor(item.status),
    }));

    const filteredAlerts = updatedAlerts.filter((item) => {
      let isVisible = true;
      if (selectedTab.id !== "ALL") {
        isVisible = item.status === selectedTab.id;
      }
      if (isVisible && severityFilter !== null) {
        isVisible = item.severity === severityFilter;
      }
      return isVisible;
    });
    console.log("Filtered Data: ", JSON.stringify(filteredAlerts));
    setFilteredData(filteredAlerts);

    const severityCounts = (["CRITICAL", "HIGH", "MEDIUM", "LOW"] as Severity[])
      .map((severity) => {
        const nums = alerts.filter(
          (item) => item.severity === severity && item.status === "OPEN"
        ).length;
        return {
          severity,
          severityColor: getSeverityColor(severity),
          nums,
        };
      })
      .filter((sev) => sev.nums > 0);

    setSevs(severityCounts);
  }, [alerts, selectedTab, severityFilter]);

  const onTabChange = useCallback(
    (value: string) => {
      setSelectedTab(
        tabItems.find((tabItem) => tabItem.id === value) ?? tabItems[0]
      );
    },
    [tabItems]
  );

  const onSeverityCardClick = useCallback((value: Severity) => {
    if (severityFilter === value) {
      setSeverityFilter(null);
    } else {
      setSeverityFilter(value);
    }
  }, []);

  const onClickItem = useCallback(
    (item: DashboardAlert) => {
      navigate(`/alert/${item.id}`);
    },
    [filteredData]
  );

  return (
    <div className="container flex flex-col">
      <>
        <div className="my-6 hidden space-x-2 md:flex">
          {sevs.map((sev) => (
            <Card
              key={sev.severity}
              onClick={() => onSeverityCardClick(sev.severity)}
              style={{ backgroundColor: sev.severityColor }}
              className={twMerge(
                "hover: flex cursor-pointer items-center space-x-4 px-8 py-4 text-white md:space-x-8",
                severityFilter &&
                  severityFilter !== sev.severity &&
                  "opacity-50"
              )}
            >
              <span className="flex-1 space-x-2">
                <span className="text-4xl font-semibold">{sev.nums}</span>
                <span className="text-sm font-thin">
                  {sev.severity.toLocaleLowerCase()} alerts
                </span>
              </span>
              <span className="hidden rounded-full border-2 border-white p-1 md:inline-block">
                <LuFlame className="text-white" />
              </span>
            </Card>
          ))}
        </div>
        <div className="flex-1 space-y-4">
          <Tabs
            defaultValue="OPEN"
            className="hidden w-[600px] md:block"
            onValueChange={onTabChange}
          >
            <TabsList className="grid w-full grid-cols-3">
              {tabItems.map((tabItem) => (
                <TabsTrigger key={tabItem.id} value={tabItem.id}>
                  {tabItem.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="space-y-2">
            <div className="px-4 py-2 font-semibold md:grid md:grid-cols-table">
              <div className="hidden md:inline"></div>
              <div className="hidden md:inline">ID</div>
              <div>
                <div>{t("alertDashboard.rowLabels.dateTimeOpened")}</div>
                {selectedTab.id !== "OPEN" && (
                  <div>{t("alertDashboard.rowLabels.dateTimeClosed")}</div>
                )}
              </div>
              <div>{t("alertDashboard.rowLabels.name")}</div>
              <div>{t("alertDashboard.rowLabels.severity")}</div>
            </div>
            <div className="grid gap-2">
              {filteredData.length === 0 && (
                <div className="flex min-h-52 w-full flex-col items-center justify-center">
                  {selectedTab.id == "OPEN" && (
                    <LuCoffee className="h-28 w-28 text-slate-300" />
                  )}
                  <span className="text-slate-400">No alerts</span>
                </div>
              )}
              {filteredData.map((item) => (
                <Card
                  key={item.id}
                  className="cursor-pointer items-center space-y-1 p-4 hover:bg-secondary md:grid md:grid-cols-table"
                  onClick={() => {
                    onClickItem(item);
                  }}
                >
                  <div className="hidden items-center md:flex">
                    <span
                      className="inline-block rounded-full border-2 p-1"
                      style={{
                        borderColor: item.statusColor || item.severityColor,
                        backgroundColor: item.statusColor || item.severityColor,
                      }}
                    >
                      {item.status === "OPEN" ? (
                        <LuFlame className="text-white" />
                      ) : (
                        <LuCheck className="text-white" />
                      )}
                    </span>
                  </div>
                  <div className="hidden md:inline">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>{item.id.split("-")[0]}</TooltipTrigger>
                        <TooltipContent>{item.id}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div>
                    <div>{new Date(item.openedAt).toLocaleString()}</div>
                    {selectedTab.id !== "OPEN" && (
                      <div>
                        {item.closedAt
                          ? new Date(item.closedAt).toLocaleString()
                          : "Still open"}
                      </div>
                    )}
                  </div>
                  <div className="overflow-hidden text-ellipsis">
                    {item.name}
                  </div>
                  <div
                    className="font-semibold"
                    style={{
                      color: item.severityColor,
                    }}
                  >
                    {item.severity}
                  </div>
                  <div className="hidden md:inline">
                    <Button variant="ghost" size="icon">
                      <LuChevronRight />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </>
    </div>
  );
}
export default AlertPage;
