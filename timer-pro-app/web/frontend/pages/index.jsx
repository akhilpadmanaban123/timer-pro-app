import { useState, useEffect } from "react";
import { 
  Page, 
  Layout, 
  Card, 
  ResourceList, 
  ResourceItem, 
  Text, 
  Badge, 
  Button, 
  LegacyStack,
  EmptyState
} from "@shopify/polaris";
import { useNavigate } from "react-router-dom";
// Requirement 5.1: Use authenticated fetch to pass session tokens
import { useAuthenticatedFetch } from "../hooks"; 

export default function HomePage() {
  const navigate = useNavigate();
  const fetch = useAuthenticatedFetch(); // Replaces standard browser fetch
  const [savedTimers, setSavedTimers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch all timers belonging to the current shop
  const fetchTimers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/timers");
      if (response.ok) {
        const data = await response.json();
        setSavedTimers(data);
      }
    } catch (error) {
      console.error("Error fetching timers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTimers(); }, []);

  // 2. Delete logic using authenticated request
  const deleteTimer = async (id) => {
    if (!confirm("Are you sure you want to delete this timer?")) return;

    try {
      const response = await fetch(`/api/timers/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // UI update: Filter out the deleted timer from state
        setSavedTimers((prev) => prev.filter((t) => t._id !== id));
      } else {
        const errorData = await response.json();
        alert(`Delete failed: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error("Error deleting timer:", error);
      alert("Network error while trying to delete.");
    }
  };

  return (
    <Page 
      title="Flash Sale Dashboard"
      primaryAction={
        <Button primary onClick={() => navigate("/new")}>
          Create New Timer
        </Button>
      }
    >
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <div style={{ marginBottom: '20px' }}>
              <Text variant="headingMd" as="h2">Active Campaigns</Text>
            </div>
            
            <ResourceList
              loading={isLoading}
              resourceName={{ singular: 'timer', plural: 'timers' }}
              items={savedTimers}
              emptyState={
                <EmptyState
                  heading="No timers found"
                  action={{ content: 'Create Timer', onClick: () => navigate("/pagename") }}
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>Start by creating a new flash sale campaign using the AI tool.</p>
                </EmptyState>
              }
              renderItem={(item) => {
                const { _id, title, endDate, targetIds } = item;
                return (
                  <ResourceItem id={_id}>
                    <LegacyStack distribution="equalSpacing" alignment="center">
                      <LegacyStack vertical spacing="extraTight">
                        <Text variant="bodyMd" fontWeight="bold">{title}</Text>
                        <Text color="subdued">
                          Ends: {new Date(endDate).toLocaleDateString()}
                        </Text>
                      </LegacyStack>
                      
                      <LegacyStack spacing="tight" alignment="center">
                        <Badge status="info">{targetIds?.length || 0} Products</Badge>
                        <Button 
                          destructive 
                          outline 
                          size="slim" 
                          onClick={() => deleteTimer(_id)}
                        >
                          Delete
                        </Button>
                      </LegacyStack>
                    </LegacyStack>
                  </ResourceItem>
                );
              }}
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}