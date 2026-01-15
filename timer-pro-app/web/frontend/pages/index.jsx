import { Page, Layout, Card, Button, Text } from "@shopify/polaris";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <Page title="Timer Pro Dashboard">
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <Text as="h2" variant="headingMd">Welcome to Timer Pro</Text>
              <Text as="p">Create urgency-driven countdown timers for your products.</Text>
              <Button 
                variant="primary" 
                onClick={() => navigate("/new")}
              >
                Create New Timer
              </Button>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}