import { NextPage } from "next";
import { Text } from "@saleor/macaw-ui";
import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { getPaymentLog } from "@/actions/getPaymentLog";

const ClientWidget: NextPage = () => {
  const { appBridgeState } = useAppBridge();

  if (!appBridgeState?.ready) {
    return <Text>Loading widget...</Text>;
  }

  const path = appBridgeState.path;

  const isWidgetPath = path?.includes("/orders/");
  const orderId = isWidgetPath ? path.split("/orders/")[1] : null;

  if (!orderId) {
    return <Text>Order ID not found in the path.</Text>;
  }

  const orderDetails = getPaymentLog(orderId);

  return <Text>Payment App Order Transaction Details -- TODO</Text>;
};

export default ClientWidget;
