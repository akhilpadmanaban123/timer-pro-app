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
import { useAuthenticatedFetch } from "../hooks"; 

export default function HomePage() {
  const navigate = useNavigate();
  const fetch = useAuthenticatedFetch(); 
  const [savedTimers, setSavedTimers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const deleteTimer = async (id) => {
    if (!confirm("Are you sure you want to delete this timer?")) return;
    try {
      const response = await fetch(`/api/timers/${id}`, { method: "DELETE" });
      if (response.ok) {
        setSavedTimers((prev) => prev.filter((t) => t._id !== id));
      }
    } catch (error) {
      console.error("Error deleting timer:", error);
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
                  action={{ content: 'Create Timer', onClick: () => navigate("/new") }}
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>Start by creating a new flash sale campaign using the AI tool.</p>
                </EmptyState>
              }
renderItem={(item) => {
  const { _id, title, endDate, targetIds, analytics, type } = item;
  return (
    <ResourceItem id={_id}>
      <LegacyStack distribution="equalSpacing" alignment="center">
        <LegacyStack vertical spacing="extraTight">
  <Text variant="bodyMd" fontWeight="bold">{title}</Text>
  <LegacyStack spacing="tight">
    {/* Dynamic Badges based on type */}
    <Badge status={type === 'evergreen' ? 'info' : 'attention'}>
      {type === 'evergreen' ? 'Evergreen (Blue)' : 'Fixed (Red)'}
    </Badge>
    <Text color="subdued">
      {type === 'evergreen' ? `${endDate} Minute Session` : `Ends: ${endDate}`}
    </Text>
  </LegacyStack>
</LegacyStack>
        
        <LegacyStack spacing="loose" alignment="center">
          {/* Dashboard Analytics Section */}
          <div style={{ textAlign: 'center', minWidth: '60px' }}>
            <Text variant="headingSm">{analytics?.impressions || 0}</Text>
            <Text variant="bodyXs" color="subdued">Views</Text>
          </div>

          <Badge status="info">{targetIds?.length || 0} Products</Badge>
          
          <Button destructive outline size="slim" onClick={() => deleteTimer(_id)}>
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