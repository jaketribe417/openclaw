"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEquipmentStore } from "@/stores/equipment-store";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Camera, Clock, AlertCircle, CheckCircle, ChevronLeft, Search } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Quick issue templates
const quickTemplates = [
  { id: "jam", label: "Paper Jam", category: "mechanical" },
  { id: "quality", label: "Print Quality Issue", category: "quality" },
  { id: "communication", label: "Communication Error", category: "software" },
  { id: "noise", label: "Unusual Noise", category: "mechanical" },
  { id: "overheat", label: "Overheating", category: "mechanical" },
  { id: "other", label: "Other", category: "other" },
];

export default function ReportIssuePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const { equipment, buildings, floors, zones, fetchEquipment, fetchBuildings, fetchFloors, fetchZones, reportIssue } = useEquipmentStore();

  const [step, setStep] = useState<"select" | "details" | "submit">("select");
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [issueType, setIssueType] = useState<"critical" | "non-critical">("critical");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchEquipment();
    fetchBuildings();
  }, [fetchEquipment, fetchBuildings]);

  useEffect(() => {
    if (selectedBuilding) {
      fetchFloors(selectedBuilding);
    }
  }, [selectedBuilding, fetchFloors]);

  useEffect(() => {
    if (selectedFloor) {
      fetchZones(selectedFloor);
    }
  }, [selectedFloor, fetchZones]);

  // Filter equipment based on selections and search
  const filteredEquipment = equipment.filter((eq) => {
    const matchesBuilding = !selectedBuilding || eq.buildingId === selectedBuilding;
    const matchesFloor = !selectedFloor || eq.floorId === selectedFloor;
    const matchesZone = !selectedZone || eq.zoneId === selectedZone;
    const matchesSearch = 
      eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.equipmentId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBuilding && matchesFloor && matchesZone && matchesSearch;
  });

  // Group equipment by zone for better organization
  const equipmentByZone = filteredEquipment.reduce((acc, eq) => {
    const zoneId = eq.zoneId || "uncategorized";
    if (!acc[zoneId]) acc[zoneId] = [];
    acc[zoneId].push(eq);
    return acc;
  }, {} as Record<string, typeof equipment>);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = quickTemplates.find((t) => t.id === templateId);
    if (template) {
      setDescription(template.label);
    }
  };

  const handleSubmit = async () => {
    if (!selectedEquipment) return;
    
    setIsSubmitting(true);
    try {
      await reportIssue({
        equipmentId: selectedEquipment,
        reportedBy: user?.id || "unknown",
        issueType: issueType === "critical" ? "critical" : "non_critical",
        priority: issueType,
        description: description || undefined,
      });
      
      toast({
        title: "Issue Reported",
        description: "Your issue has been submitted successfully.",
      });
      
      router.push("/dashboard");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit issue. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getZoneName = (zoneId: string) => {
    if (zoneId === "uncategorized") return "Uncategorized";
    const zone = zones.find((z) => z.id === zoneId);
    return zone?.name || "Unknown Zone";
  };

  const getEquipmentName = (id: string) => {
    const eq = equipment.find((e) => e.id === id);
    return eq?.name || "Unknown Equipment";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Report Issue</h1>
              <p className="text-sm text-gray-500">Step {step === "select" ? 1 : step === "details" ? 2 : 3} of 3</p>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-2">
          <div className="flex gap-1">
            {["select", "details", "submit"].map((s, i) => (
              <div
                key={s}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  step === s || ["details", "submit"].includes(step) && s === "select" || step === "submit" && s === "details"
                    ? "bg-blue-500"
                    : "bg-gray-200"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {step === "select" && (
          <div className="space-y-6">
            {/* Location Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Filter by Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <Select value={selectedBuilding || ""} onValueChange={setSelectedBuilding}>
                    <SelectTrigger>
                      <SelectValue placeholder="Building" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Buildings</SelectItem>
                      {buildings.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedFloor || ""} onValueChange={setSelectedFloor} disabled={!selectedBuilding}>
                    <SelectTrigger>
                      <SelectValue placeholder="Floor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Floors</SelectItem>
                      {floors.map((f) => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedZone || ""} onValueChange={setSelectedZone} disabled={!selectedFloor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Zone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Zones</SelectItem>
                      {zones.map((z) => (
                        <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search equipment..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Equipment Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Select Equipment</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredEquipment.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p>No equipment found</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto">
                    {Object.entries(equipmentByZone).map(([zoneId, zoneEquipment]) => (
                      <div key={zoneId}>
                        <p className="text-sm font-medium text-gray-500 mb-2 sticky top-0 bg-white py-1">
                          {getZoneName(zoneId)}
                        </p>
                        <div className="space-y-2">
                          {zoneEquipment.map((eq) => (
                            <button
                              key={eq.id}
                              onClick={() => {
                                setSelectedEquipment(eq.id);
                                setStep("details");
                              }}
                              className={cn(
                                "w-full text-left p-3 rounded-lg border-2 transition-all",
                                selectedEquipment === eq.id
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{eq.name}</p>
                                  <p className="text-sm text-gray-500">{eq.equipmentId}</p>
                                </div>
                                {selectedEquipment === eq.id && (
                                  <CheckCircle className="h-5 w-5 text-blue-500" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {step === "details" && (
          <div className="space-y-6">
            {/* Selected Equipment */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Selected Equipment</p>
                    <p className="text-lg font-semibold">{getEquipmentName(selectedEquipment!)}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setStep("select")}>
                    Change
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Issue Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Issue Severity</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={issueType} onValueChange={(v) => setIssueType(v as "critical" | "non-critical")}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <RadioGroupItem value="critical" id="critical" className="sr-only" />
                      <Label
                        htmlFor="critical"
                        className={cn(
                          "flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all",
                          issueType === "critical"
                            ? "border-red-500 bg-red-50"
                            : "border-gray-200 hover:border-red-300"
                        )}
                      >
                        <AlertCircle className="h-8 w-8 mb-2 text-red-500" />
                        <span className="font-semibold text-red-700">Critical</span>
                        <span className="text-xs text-gray-500">Equipment is down</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="non-critical" id="non-critical" className="sr-only" />
                      <Label
                        htmlFor="non-critical"
                        className={cn(
                          "flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all",
                          issueType === "non-critical"
                            ? "border-yellow-500 bg-yellow-50"
                            : "border-gray-200 hover:border-yellow-300"
                        )}
                      >
                        <Clock className="h-8 w-8 mb-2 text-yellow-500" />
                        <span className="font-semibold text-yellow-700">Non-Critical</span>
                        <span className="text-xs text-gray-500">Minor issue</span>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Quick Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Select Issue Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {quickTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template.id)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm border-2 transition-all",
                        selectedTemplate === template.id
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 hover:border-blue-300"
                      )}
                    >
                      {template.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Additional Details (Optional)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Describe the issue in more detail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
                
                <button className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
                  <Camera className="h-4 w-4" />
                  Attach Photo (optional)
                </button>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep("select")}>
                Back
              </Button>
              <Button 
                className="flex-1" 
                onClick={() => setStep("submit")}
                disabled={!selectedTemplate}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === "submit" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Confirm Report</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Equipment</span>
                    <span className="font-medium">{getEquipmentName(selectedEquipment!)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Severity</span>
                    <Badge variant={issueType === "critical" ? "destructive" : "default"}>
                      {issueType === "critical" ? "Critical" : "Non-Critical"}
                    </Badge>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Issue Type</span>
                    <span className="font-medium">
                      {quickTemplates.find((t) => t.id === selectedTemplate)?.label}
                    </span>
                  </div>
                  {description && (
                    <div className="py-2 border-b">
                      <span className="text-gray-500">Description</span>
                      <p className="mt-1 text-sm">{description}</p>
                    </div>
                  )}
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> This will immediately notify technicians and mark the equipment as {issueType === "critical" ? "down" : "degraded"}.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => setStep("details")}
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                  <Button 
                    className="flex-1" 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Report"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
