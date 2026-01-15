import { useMemo } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";

export function useAuthenticatedFetch() {
  const app = useAppBridge();
  
  return async (uri, options) => {
    // We use the standard fetch but the App Bridge provider 
    // handles the session headers automatically in this template
    const response = await fetch(uri, options);
    return response;
  };
}