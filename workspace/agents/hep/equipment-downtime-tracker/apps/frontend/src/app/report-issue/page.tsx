"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuthStore } from "@/stores/auth-store";
import { useEquipmentStore } from "@/stores/equipment-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft,
  Camera,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Settings,
  Loader2,
  Zap
} from "lucide-react";
import Link from "next/link";
import { Equipment, DowntimeSeverity } from "@edt/shared";
import { equipmentStatusConfig } from "@/lib/status-config";

export default function ReportIssuePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuthStore();
  const { 
    equipment, 
    isLoading, 
    fetchEquipment,
    reportIssue 
  } = useEquipmentStore();

  // Form state
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>("");
  const [severity, setSeverity] = useState<DowntimeSeverity>("non_critical");
  const [description, setDescription] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [step, setStep] = useState<number>(1);

  // Get pre-selected equipment from URL
  const preSelectedId = searchParams.get("equipment");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchEquipment();
  }, [isAuthenticated, router, fetchEquipment]);

  useEffect(() => {
    if (preSelectedId && equipment.some((e) => e.id === preSelectedId)) {
      setSelectedEquipmentId(preSelectedId);
      setStep(2);
    }
  }, [preSelectedId, equipment]);

  const selectedEquipment = equipment.find((e) => e.id === selectedEquipmentId);

  // Filter equipment for search
  const filteredEquipment = equipment.filter((e) => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.equipmentId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!selectedEquipment || !user) return;

    setIsSubmitting(true);
    try {
      await reportIssue({
        equipmentId: selectedEquipment.id,
        reportedBy: user.id,
        issueType: severity === "critical" ? "Critical Issue" : "Non-Critical Issue",
        priority: severity,
        description,
      });

      toast({
        title: "Issue Reported",
        description: "Your issue has been reported successfully",
      });

      // Reset form and redirect
      setStep(1);
      setSelectedEquipmentId("");
      setSeverity("non_critical");
      setDescription("");
      router.push("/downtime-events");
    } catch (error) {
      toast({
        title: "Failed to Report",
        description: "There was an error reporting the issue. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = selectedEquipment && description.trim().length > 0;

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Header */}
        <Button variant="ghost" asChild className="-ml-4">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>

        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Report Issue</h1>
          <p className="text-muted-foreground mt-2">
            Report equipment downtime in under 30 seconds
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="flex items-center">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              1
            </div>
            <div className="ml-2 hidden sm:block">
              <p className="text-sm font-medium">Equipment</p>
            </div>
          </div>
          <div className="h-px w-8 bg-border" />
          <div className="flex items-center">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              2
            </div>
            <div className="ml-2 hidden sm:block">
              <p className="text-sm font-medium">Details</p>
            </div>
          </div>
          <div className="h-px w-8 bg-border" />
          <div className="flex items-center">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              3
            </div>
            <div className="ml-2 hidden sm:block">
              <p className="text-sm font-medium">Submit</p>
            </div>
          </div>
        </div>

        {/* Step 1: Select Equipment */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Select Equipment</CardTitle>
              <CardDescription>
                Choose the equipment experiencing issues
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Input
                  placeholder="Search equipment by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Equipment List */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : filteredEquipment.length === 0 ? (
                  <div className="text-center py-8">
                    <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No equipment found</p>
                  </div>
                ) : (
                  filteredEquipment.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelectedEquipmentId(item.id);
                        setStep(2);
                      }}
                      className={`w-full flex items-center gap-4 p-4 rounded-lg border text-left transition-colors hover:bg-accent ${
                        selectedEquipmentId === item.id ? "border-primary bg-primary/5" : ""
                      }`}
                    >
                      <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Settings className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.equipmentId}</p>
                      </div>
                      <Badge 
                        variant={item.status === "running" ? "default" : "secondary"}
                        className={item.status === "down" ? "bg-red-100 text-red-700" : ""}
                      >
                        {item.status}
                      </Badge>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Issue Details */}
        {step === 2 && selectedEquipment && (
          <Card>
            <CardHeader>
              <CardTitle>Issue Details</CardTitle>
              <CardDescription>
                Describe the issue for {selectedEquipment.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Selected Equipment Summary */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
                <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Settings className="h-5 w-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{selectedEquipment.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedEquipment.equipmentId}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                  Change
                </Button>
              </div>

              {/* Severity Selection */}
              <div className="space-y-2">
                <Label>Severity Level</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setSeverity("non_critical")}
                    className={`p-4 rounded-lg border text-left transition-colors ${
                      severity === "non_critical" 
                        ? "border-primary bg-primary/5" 
                        : "hover:bg-accent"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-yellow-500" />
                      <span className="font-medium">Non-Critical</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Issue can be addressed during normal maintenance
                    </p>
                  </button>
                  <button
                    onClick={() => setSeverity("critical")}
                    className={`p-4 rounded-lg border text-left transition-colors ${
                      severity === "critical" 
                        ? "border-primary bg-primary/5" 
                        : "hover:bg-accent"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <span className="font-medium">Critical</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Immediate attention required - production impact
                    </p>
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the issue you're experiencing..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground">
                  {description.length}/500 characters
                </p>
              </div>

              {/* Photo Attachment (placeholder) */}
              <div className="space-y-2">
                <Label>Photo (Optional)</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:bg-accent/50 transition-colors cursor-pointer">
                  <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG up to 5MB
                  </p>
                </div>
              </div>

              {/* Quick Description Templates */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">Quick Templates</Label>
                <div className="flex flex-wrap gap-2">
                  {["Not starting", "Making noise", "Error code", "Overheating", "Jam/Stuck"].map((template) => (
                    <button
                      key={template}
                      onClick={() => setDescription(template)}
                      className="text-sm px-3 py-1.5 rounded-full border hover:bg-accent transition-colors"
                    >
                      {template}
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-4 pt-4">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={() => setStep(3)} 
                  className="flex-1"
                  disabled={!description.trim()}
                >
                  Review
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Review & Submit */}
        {step === 3 && selectedEquipment && (
          <Card>
            <CardHeader>
              <CardTitle>Review & Submit</CardTitle>
              <CardDescription>
                Confirm the details before submitting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <span className="text-muted-foreground">Equipment</span>
                  <span className="font-medium">{selectedEquipment.name}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <span className="text-muted-foreground">Severity</span>
                  <Badge 
                    variant={severity === "critical" ? "destructive" : "secondary"}
                  >
                    {severity === "critical" ? "Critical" : "Non-Critical"}
                  </Badge>
                </div>
                <div className="p-4 rounded-lg border">
                  <span className="text-muted-foreground block mb-2">Description</span>
                  <p className="font-medium">{description}</p>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <span className="text-muted-foreground">Reported By</span>
                  <span className="font-medium">{user?.name}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-medium">{new Date().toLocaleString()}</span>
                </div>
              </div>

              {/* Estimated Time */}
              <Alert className="bg-blue-50 border-blue-200">
                <Clock className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700">
                  Average response time for {severity === "critical" ? "critical" : "non-critical"} issues: 
                  <span className="font-medium"> {severity === "critical" ? "15 minutes" : "2 hours"}</span>
                </AlertDescription>
              </Alert>

              {/* Navigation Buttons */}
              <div className="flex gap-4 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setStep(2)} 
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  className="flex-1"
                  disabled={isSubmitting || !canSubmit}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting ? "Submitting..." : "Submit Report"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Text */}
        <p className="text-center text-sm text-muted-foreground">
          Need help? Contact your supervisor or call the maintenance hotline.
        </p>
      </div>
    </DashboardLayout>
  );
}
