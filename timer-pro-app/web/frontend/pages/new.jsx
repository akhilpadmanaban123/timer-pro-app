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
  const [duration, setDuration] = useState("30");

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

  // LOGIC: Ensure we capture the 'type' state correctly
  const timerData = {
    title: title,
    type: type, // This must be 'evergreen' or 'fixed'
    // If evergreen, we send the duration (e.g. "30") as the endDate string
    endDate: type === 'evergreen' ? duration : endDate, 
    targetType: selectedProducts.length > 0 ? 'product' : 'all',
    targetIds: selectedProducts.map(product => product.id),
    analytics: { impressions: 0 }
  };

  console.log("Saving Timer Data:", timerData); // Check your console to see if type is 'evergreen'

  try {
    const response = await fetch("/api/timers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(timerData),
    });

    if (response.ok) navigate("/");
  } catch (error) {
    console.error("Save error:", error);
  } finally {
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
  // IMPORTANT: Ensure the state 'setType' is actually receiving the value
  onChange={(selected) => setType(selected)} 
  value={type}
/>
              {type === 'fixed' ? (
  <TextField 
    label="End Date (YYYY-MM-DD)" 
    value={endDate} 
    onChange={setEndDate} 
    autoComplete="off" 
    placeholder="2026-12-31" 
  />
) : (
  <TextField 
    label="Duration (Minutes)" 
    type="number"
    value={duration} 
    onChange={setDuration} 
    autoComplete="off" 
    helpText="Timer starts when a unique customer first visits the product."
  />
)}
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