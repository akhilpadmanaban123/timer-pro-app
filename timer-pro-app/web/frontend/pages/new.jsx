import { Page, Layout, FormLayout, TextField, Card, Button, Select } from "@shopify/polaris";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthenticatedFetch } from "../hooks/index"; 

export default function NewTimer() {
  const navigate = useNavigate();
  const fetch = useAuthenticatedFetch();
  
  const [title, setTitle] = useState("");
  const [type, setType] = useState("fixed");
  const [endDate, setEndDate] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [aiIntent, setAiIntent] = useState("");

  // Requirement 4.7: AI Suggestion Flow
  const handleAiGenerate = async () => {
    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: aiIntent }),
      });
      if (response.ok) {
        const suggestion = await response.json();
        setTitle(suggestion.title || "");
        setType(suggestion.type || "fixed");
        setEndDate(suggestion.endDate || "");
      }
    } catch (err) { console.error("AI Error", err); }
  };

  // App Bridge 4.0 Resource Picker Logic
  const selectProducts = async () => {
  // Check if shopify exists globally to prevent silent failure
  if (typeof window.shopify !== "undefined") {
    const selected = await window.shopify.resourcePicker({
      type: "product",
      multiple: true,
    });
    if (selected) setSelectedProducts(selected);
  } else {
    console.error("Shopify App Bridge not loaded. Are you outside the Shopify Admin?");
  }
};

  const handleSave = async () => {
  if (!title) return;
  setIsSaving(true);

  // Prepare the data to match your MongoDB Schema
  const timerData = {
    title: title,
    type: type,
    endDate: endDate,
    targetType: selectedProducts.length > 0 ? 'product' : 'all',
    // We map through selectedProducts to get just the ID strings
    targetIds: selectedProducts.map(product => product.id), 
  };

  try {
    const response = await fetch("/api/timers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(timerData),
    });

    if (response.ok) {
      // If the backend responds with success, we stop the spinner and leave
      navigate("/");
    } else {
      console.error("Failed to save");
      setIsSaving(false); // Stop spinner so user can try again
    }
  } catch (error) {
    console.error("Network error:", error);
    setIsSaving(false);
  }
};
  return (
    <Page
      title="Create New Timer"
      backAction={{ content: 'Dashboard', url: '/' }}
      primaryAction={<Button variant="primary" loading={isSaving} onClick={handleSave}>Save Timer</Button>}
    >
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <FormLayout>
              <TextField label="Timer Name" value={title} onChange={setTitle} autoComplete="off" />
              <Select
                label="Timer Type"
                options={[
                  {label: 'Fixed (Static Date)', value: 'fixed'},
                  {label: 'Evergreen (Session-based)', value: 'evergreen'}
                ]}
                onChange={setType}
                value={type}
              />
              <TextField label="End Date (YYYY-MM-DD)" value={endDate} onChange={setEndDate} autoComplete="off" placeholder="2026-12-31" />
              <Button onClick={selectProducts}>
                {selectedProducts.length > 0 ? `Selected ${selectedProducts.length} Products` : "Select Products"}
              </Button>
            </FormLayout>
          </Card>
        </Layout.Section>
        <Layout.Section secondary>
          <Card title="AI Assistant" sectioned>
            <FormLayout>
              <TextField 
                label="Describe your intent"
                value={aiIntent} 
                onChange={setAiIntent} 
                placeholder="e.g. flash sale" 
                multiline={2} 
              />
              <Button onClick={handleAiGenerate}>Generate with AI</Button>
            </FormLayout>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}