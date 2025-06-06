import { useState, useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  FormLayout,
  TextField,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export const action = async ({ request }) => {  
  // Parse form data
  const formData = await request.formData();
  const title = formData.get("title");
  const body = formData.get("body");

  // Webhook URL - replace with your actual webhook endpoint
  const webhookUrl = "https://us-central1-perfumebox-3c4f2.cloudfunctions.net/broadcastNotification";

  try {
    // Send data to webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        body,
      }),
    });

    if (!webhookResponse.ok) {
      throw new Error(`Webhook failed: ${webhookResponse.status}`);
    }

    return {
      success: true,
      message: "Form submitted successfully!",
      data: { title, body }
    };
  } catch (error) {
    console.error("Webhook error:", error);
    return {
      success: false,
      message: "Failed to submit form. Please try again.",
      error: error.message
    };
  }
};

export default function Index() {
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const isLoading = fetcher.state === "submitting";
  const isSuccess = fetcher.data?.success;

  useEffect(() => {
    if (fetcher.data?.success) {
      shopify.toast.show(fetcher.data.message);
      // Reset form on success
      setTitle("");
      setBody("");
    } else if (fetcher.data?.success === false) {
      shopify.toast.show(fetcher.data.message, { isError: true });
    }
  }, [fetcher.data, shopify]);

  const handleSubmit = () => {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("body", body);
    
    fetcher.submit(formData, { method: "POST" });
  };

  return (
    <Page>
      <TitleBar title="Broadcast Notification" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Send Notification
                  </Text>
                  <FormLayout>
                    <TextField
                      label="Title"
                      value={title}
                      onChange={setTitle}
                      autoComplete="off"
                      placeholder="Enter notification title"
                      disabled={isLoading}
                    />
                    <TextField
                      type="text"
                      label="Body"
                      value={body}
                      multiline={4}
                      onChange={setBody}
                      autoComplete="off"
                      placeholder="Enter notification body"
                      disabled={isLoading}
                    />
                    <Button 
                      primary
                      onClick={handleSubmit}
                      loading={isLoading}
                      disabled={!title || !body || isLoading}
                    >
                      {isLoading ? "Submitting..." : "Submit"}
                    </Button>
                  </FormLayout>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}