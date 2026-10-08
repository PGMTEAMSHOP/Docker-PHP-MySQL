-- Load OSX UI Library
local OSX = loadstring(game:HttpGet("https://raw.githubusercontent.com/yxucnx/OSX-HUB-Lib/refs/heads/main/OSX_Lib.lua?v=" .. tick()))()

-- Services
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local UserInputService = game:GetService("UserInputService")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local VirtualUser = game:GetService("VirtualUser")
local Workspace = game:GetService("Workspace")
local Lighting = game:GetService("Lighting")

local localPlayer = Players.LocalPlayer
local camera = Workspace.CurrentCamera

-- Fetch Game Name
local success, productInfo = pcall(function()
    return game:GetService("MarketplaceService"):GetProductInfo(game.PlaceId)
end)
local GameName = success and productInfo and productInfo.Name or "Universal"

-- Window Setup
local Window = OSX:CreateWindow({
    Title = "OSX HUB | Universal All Game | " .. GameName,
    Subtitle = "Made by: LilYouDev1997 | Discord: discord.gg/osxhub",
    WindowLogo = "https://img2.pic.in.th/logo512v2.png",
    FloatingLogo = "https://img1.pic.in.th/images/logo512v1.png",
    ToggleKey = Enum.KeyCode.RightControl
})

-- ==========================================
-- Info Tab
-- ==========================================
local InfoTab = Window:AddTab({ Title = "Info", SubDescription = "Information", Icon = "info" })
local InfoPanel = InfoTab:AddPanel("Information")
InfoPanel:AddInfoLabel("Owner:", "Darkmxde.")
InfoPanel:AddInfoLabel("Developer:", "LilYouDev1997x")
InfoPanel:AddInfoLabel("Discord:", "https://discord.gg/osxhub")

InfoPanel:AddWideButton({
    Title = "Discord Server",
    Callback = function() pcall(function() setclipboard("https://discord.gg/osxhub") end) end
})

-- ==========================================
-- Player Tab
-- ==========================================
local PlayerTab = Window:AddTab({ Title = "Player", SubDescription = "Movement Settings", Icon = "user" })

local PlayerPanel = PlayerTab:AddPanel("Movement Controls")

local walkSpeedAmount = 16
local walkSpeedEnabled = false

PlayerPanel:AddToggle({
    Title = "Enable Walk Speed",
    Description = "เปิด/ปิด การปรับความเร็วตัวละคร",
    Default = false,
    Callback = function(Value)
        walkSpeedEnabled = Value
        if not Value and localPlayer.Character and localPlayer.Character:FindFirstChild("Humanoid") then
            localPlayer.Character.Humanoid.WalkSpeed = 16
        end
    end
})

PlayerPanel:AddSlider({
    Title = "Walk Speed Value",
    Description = "เลื่อนเพื่อปรับความเร็ว",
    Min = 16,
    Max = 500,
    Default = 16,
    Rounding = 1,
    Callback = function(Value)
        walkSpeedAmount = Value
    end
})

RunService.Heartbeat:Connect(function()
    if walkSpeedEnabled and localPlayer.Character and localPlayer.Character:FindFirstChild("Humanoid") then
        localPlayer.Character.Humanoid.WalkSpeed = walkSpeedAmount
    end
end)

local infJumpEnabled = false
PlayerPanel:AddToggle({
    Title = "Infinity Jump",
    Description = "กระโดดได้ไม่จำกัดบนอากาศ",
    Default = false,
    Callback = function(Value) infJumpEnabled = Value end
})

UserInputService.JumpRequest:Connect(function()
    if infJumpEnabled and localPlayer.Character and localPlayer.Character:FindFirstChild("Humanoid") then
        localPlayer.Character.Humanoid:ChangeState(Enum.HumanoidStateType.Jumping)
    end
end)

-- ==========================================
-- Visuals Tab (ESP)
-- ==========================================
local VisualsTab = Window:AddTab({ Title = "Visuals", SubDescription = "ESP & Chams", Icon = "eye" })

local ESPPanel = VisualsTab:AddPanel("ESP Features")

local ESP_Settings = {
    Enabled = false,
    Box_Color = Color3.fromRGB(0, 255, 50),
    Box_Thickness = 1.4,
    Tracers = false,
    Tracer_Color = Color3.fromRGB(0, 255, 50),
    Team_Check = false,
    ChamsEnabled = false,
    Chams_Color = Color3.fromRGB(0, 0, 255),
    Chams_Transparency = 0.5,
    RGB_Mode = false
}

ESPPanel:AddToggle({
    Title = "Enable ESP Box",
    Description = "แสดงกล่องสี่เหลี่ยมรอบตัวผู้เล่น",
    Callback = function(Value) ESP_Settings.Enabled = Value end
})

ESPPanel:AddToggle({
    Title = "Enable Tracers",
    Description = "แสดงเส้นสายจากล่างจอไปหาผู้เล่น",
    Callback = function(Value) ESP_Settings.Tracers = Value end
})

ESPPanel:AddToggle({
    Title = "Team Check",
    Description = "ซ่อนเพื่อนร่วมทีม/แยกสี",
    Callback = function(Value) ESP_Settings.Team_Check = Value end
})

ESPPanel:AddToggle({
    Title = "Rainbow (RGB) Mode",
    Description = "เปลี่ยนสี ESP เป็นสีรุ้งวิ่งไปมา",
    Callback = function(Value) ESP_Settings.RGB_Mode = Value end
})

ESPPanel:AddToggle({
    Title = "Enable Chams",
    Description = "แรงเงาสีเคลือบตัวผู้เล่นทะลุกำแพง",
    Callback = function(Value) ESP_Settings.ChamsEnabled = Value end
})

ESPPanel:AddSlider({
    Title = "Chams Transparency",
    Min = 0, Max = 1, Default = 0.5, Rounding = 2,
    Callback = function(Value) ESP_Settings.Chams_Transparency = Value end
})

-- [ ESP Logic Preservation ]
local function NewLine()
    local line = Drawing.new("Line")
    line.Visible = false
    line.Thickness = 1.4
    line.Transparency = 1
    return line
end

local function ApplyESP(v)
    local lines = {
        l1 = NewLine(), l2 = NewLine(), l3 = NewLine(), l4 = NewLine(),
        l5 = NewLine(), l6 = NewLine(), l7 = NewLine(), l8 = NewLine(),
        l9 = NewLine(), l10 = NewLine(), l11 = NewLine(), l12 = NewLine(),
        Tracer = NewLine()
    }
    
    RunService.RenderStepped:Connect(function()
        if ESP_Settings.Enabled and v.Character and v.Character:FindFirstChild("HumanoidRootPart") and v ~= localPlayer then
            local pos, vis = camera:WorldToViewportPoint(v.Character.HumanoidRootPart.Position)
            if vis then
                local Size = Vector3.new(2, 3, 1.5) * 1.5
                local hrp = v.Character.HumanoidRootPart
                
                local t1 = camera:WorldToViewportPoint((hrp.CFrame * CFrame.new(-Size.X, Size.Y, -Size.Z)).p)
                local t2 = camera:WorldToViewportPoint((hrp.CFrame * CFrame.new(-Size.X, Size.Y, Size.Z)).p)
                local t3 = camera:WorldToViewportPoint((hrp.CFrame * CFrame.new(Size.X, Size.Y, Size.Z)).p)
                local t4 = camera:WorldToViewportPoint((hrp.CFrame * CFrame.new(Size.X, Size.Y, -Size.Z)).p)
                local b1 = camera:WorldToViewportPoint((hrp.CFrame * CFrame.new(-Size.X, -Size.Y, -Size.Z)).p)
                local b2 = camera:WorldToViewportPoint((hrp.CFrame * CFrame.new(-Size.X, -Size.Y, Size.Z)).p)
                local b3 = camera:WorldToViewportPoint((hrp.CFrame * CFrame.new(Size.X, -Size.Y, Size.Z)).p)
                local b4 = camera:WorldToViewportPoint((hrp.CFrame * CFrame.new(Size.X, -Size.Y, -Size.Z)).p)

                lines.l1.From, lines.l1.To = Vector2.new(t1.X, t1.Y), Vector2.new(t2.X, t2.Y)
                lines.l2.From, lines.l2.To = Vector2.new(t2.X, t2.Y), Vector2.new(t3.X, t3.Y)
                lines.l3.From, lines.l3.To = Vector2.new(t3.X, t3.Y), Vector2.new(t4.X, t4.Y)
                lines.l4.From, lines.l4.To = Vector2.new(t4.X, t4.Y), Vector2.new(t1.X, t1.Y)
                lines.l5.From, lines.l5.To = Vector2.new(b1.X, b1.Y), Vector2.new(b2.X, b2.Y)
                lines.l6.From, lines.l6.To = Vector2.new(b2.X, b2.Y), Vector2.new(b3.X, b3.Y)
                lines.l7.From, lines.l7.To = Vector2.new(b3.X, b3.Y), Vector2.new(b4.X, b4.Y)
                lines.l8.From, lines.l8.To = Vector2.new(b4.X, b4.Y), Vector2.new(b1.X, b1.Y)
                lines.l9.From, lines.l9.To = Vector2.new(b1.X, b1.Y), Vector2.new(t1.X, t1.Y)
                lines.l10.From, lines.l10.To = Vector2.new(b2.X, b2.Y), Vector2.new(t2.X, t2.Y)
                lines.l11.From, lines.l11.To = Vector2.new(b3.X, b3.Y), Vector2.new(t3.X, t3.Y)
                lines.l12.From, lines.l12.To = Vector2.new(b4.X, b4.Y), Vector2.new(t4.X, t4.Y)

                local color = ESP_Settings.RGB_Mode and Color3.fromHSV(tick() % 5 / 5, 1, 1) or ESP_Settings.Box_Color
                for _, l in pairs(lines) do if l ~= lines.Tracer then l.Color = color l.Visible = true end end
                
                if ESP_Settings.Tracers then
                    lines.Tracer.From = Vector2.new(camera.ViewportSize.X/2, camera.ViewportSize.Y)
                    lines.Tracer.To = Vector2.new(pos.X, pos.Y)
                    lines.Tracer.Color = color
                    lines.Tracer.Visible = true
                else
                    lines.Tracer.Visible = false
                end
                
                if ESP_Settings.Team_Check and v.TeamColor == localPlayer.TeamColor then
                    for _, l in pairs(lines) do l.Visible = false end
                end
            else
                for _, l in pairs(lines) do l.Visible = false end
            end
        else
            for _, l in pairs(lines) do l.Visible = false end
        end
    end)
end

for _, v in pairs(Players:GetPlayers()) do ApplyESP(v) end
Players.PlayerAdded:Connect(ApplyESP)

-- Chams Logic
RunService.Heartbeat:Connect(function()
    for _, v in pairs(Players:GetPlayers()) do
        if v.Character then
            local shouldChams = ESP_Settings.ChamsEnabled and v ~= localPlayer and v.Character:FindFirstChild("HumanoidRootPart")
            if shouldChams and ESP_Settings.Team_Check and v.TeamColor == localPlayer.TeamColor then
                shouldChams = false
            end
            
            if shouldChams then
                local cham = v.Character:FindFirstChild("OSX_Cham_Highlight") or Instance.new("Highlight")
                cham.Name = "OSX_Cham_Highlight"
                cham.Adornee = v.Character
                cham.DepthMode = Enum.HighlightDepthMode.AlwaysOnTop
                cham.FillColor = ESP_Settings.RGB_Mode and Color3.fromHSV(tick() % 5 / 5, 1, 1) or ESP_Settings.Chams_Color
                cham.FillTransparency = ESP_Settings.Chams_Transparency
                cham.OutlineColor = ESP_Settings.RGB_Mode and Color3.fromHSV(tick() % 5 / 5, 1, 1) or ESP_Settings.Chams_Color
                cham.OutlineTransparency = math.clamp(ESP_Settings.Chams_Transparency - 0.2, 0, 1)
                cham.Parent = v.Character
            else
                if v.Character:FindFirstChild("OSX_Cham_Highlight") then
                    v.Character.OSX_Cham_Highlight:Destroy()
                end
                
                -- ลบ BoxHandleAdornment เก่าที่อาจค้างอยู่
                for _, b in pairs(v.Character:GetChildren()) do
                    if b:IsA("BasePart") and b:FindFirstChild("OSX_Cham") then
                        b.OSX_Cham:Destroy()
                    end
                end
            end
        end
    end
end)

local Aim_Settings = {
    Enabled = false,
    TeamCheck = false,
    WallCheck = false,
    FOVEnabled = true,
    FOVAmount = 90,
    Sensitivity = 0.05,
    LockPart = "Head",
    TriggerKey = "MB2",
    TriggerActive = false
}

local function CheckWall(targetPart)
    local parts = camera:GetPartsObscuringTarget({camera.CFrame.Position, targetPart.Position}, {localPlayer.Character, targetPart.Parent})
    return #parts == 0
end
local AimbotTab = Window:AddTab({ Title = "Aimbot", SubDescription = "Aim Assist", Icon = "target" })

local AimPanel = AimbotTab:AddPanel("General Settings")

AimPanel:AddToggle({
    Title = "Enable Aimbot",
    Description = "ล็อคเป้าหมายอัตโนมัติ (มักใช้ร่วมกับคีย์สำหรับเล็ง)",
    Callback = function(Value) Aim_Settings.Enabled = Value end
})

AimPanel:AddDropdown({
    Title = "Target Body Part",
    Description = "เลือกส่วนของร่างกายที่ต้องการยิงเป้า",
    Values = {"Head", "HumanoidRootPart", "Torso", "UpperTorso", "LowerTorso"},
    Default = 1,
    Callback = function(Value) Aim_Settings.LockPart = Value end
})

AimPanel:AddKeybind({
    Title = "Aimbot Trigger Key",
    Description = "ปุ่มที่ใช้คลิกเพื่อเปิดระบบเล็ง (คลิก ... แล้วกดเพื่อตั้งค่า)",
    Default = "MB2",  -- MouseButton2
    Callback = function(Key, IsActive)
        if IsActive ~= nil then
             Aim_Settings.TriggerActive = IsActive
        else
             Aim_Settings.TriggerKey = Key
        end
    end
})

local ChecksPanel = AimbotTab:AddPanel("Target Checks")

ChecksPanel:AddToggle({
    Title = "Team Check",
    Description = "ไม่ล็อคเป้าเพื่อนร่วมทีม",
    Callback = function(Value) Aim_Settings.TeamCheck = Value end
})

ChecksPanel:AddToggle({
    Title = "Wall Check",
    Description = "ตรวจสอบกำแพง (ถ้าเป้าหลบหลังกำแพงจะไม่เล็ง)",
    Callback = function(Value) Aim_Settings.WallCheck = Value end
})

ChecksPanel:AddSlider({
    Title = "Aimbot Smoothing",
    Description = "ความสมูทในการหันกล้อง (0 = หันทันที)",
    Min = 0, Max = 1, Default = 0.05, Rounding = 2,
    Callback = function(Value) Aim_Settings.Sensitivity = Value end
})

local FOVPanel = AimbotTab:AddPanel("Field Of View (FOV)")

FOVPanel:AddToggle({
    Title = "Show FOV Circle",
    Default = false,
    Callback = function(Value) _G.ShowFOV = Value end
})

FOVPanel:AddSlider({
    Title = "FOV Radius",
    Description = "ปรับขนาดวงกลมการเล็งเป้า",
    Min = 30, Max = 500, Default = 90,
    Callback = function(Value) Aim_Settings.FOVAmount = Value end
})

-- Aimbot Drawing
local FOVCircle = Drawing.new("Circle")
FOVCircle.Thickness = 1
FOVCircle.NumSides = 60
FOVCircle.Color = Color3.fromRGB(255, 255, 255)

local function GetClosestTarget()
    local target = nil
    local dist = Aim_Settings.FOVEnabled and Aim_Settings.FOVAmount or 2000
    
    for _, v in pairs(Players:GetPlayers()) do
        if v ~= localPlayer and v.Character and v.Character:FindFirstChild(Aim_Settings.LockPart) and v.Character:FindFirstChild("Humanoid") and v.Character.Humanoid.Health > 0 then
            if Aim_Settings.TeamCheck and v.TeamColor == localPlayer.TeamColor then continue end
            
            local pos, vis = camera:WorldToViewportPoint(v.Character[Aim_Settings.LockPart].Position)
            local mousePos = UserInputService:GetMouseLocation()
            local magnitude = (Vector2.new(pos.X, pos.Y) - mousePos).Magnitude
            
            if magnitude < dist and vis then
                dist = magnitude
                target = v
            end
        end
    end
    return target
end

RunService.RenderStepped:Connect(function()
    FOVCircle.Visible = _G.ShowFOV or false
    FOVCircle.Radius = Aim_Settings.FOVAmount
    FOVCircle.Position = UserInputService:GetMouseLocation()
    
    local isTriggered = false
    if Aim_Settings.TriggerKey == "MB1" then 
        isTriggered = UserInputService:IsMouseButtonPressed(Enum.UserInputType.MouseButton1)
    elseif Aim_Settings.TriggerKey == "MB2" then 
        isTriggered = UserInputService:IsMouseButtonPressed(Enum.UserInputType.MouseButton2)
    else
        isTriggered = Aim_Settings.TriggerActive
    end

    if Aim_Settings.Enabled and isTriggered then
        local target = GetClosestTarget()
        if target then
            if Aim_Settings.WallCheck and not CheckWall(target.Character[Aim_Settings.LockPart]) then return end
            
            local aimPos = target.Character[Aim_Settings.LockPart].Position
            TweenService:Create(camera, TweenInfo.new(Aim_Settings.Sensitivity, Enum.EasingStyle.Sine), {CFrame = CFrame.new(camera.CFrame.Position, aimPos)}):Play()
        end
    end
end)


-- ==========================================
-- Configs Tab
-- ==========================================
local ConfigTab = Window:AddTab({ Title = "Configs", SubDescription = "Management", Icon = "database" })

local MasterConfigPanel = ConfigTab:AddPanel("Master Features")

local antiAFKEnabled = false
MasterConfigPanel:AddToggle({
    Title = "Anti AFK",
    Description = "ป้องกันการเด้งออกจากเกม",
    Callback = function(Value) antiAFKEnabled = Value end
})

localPlayer.Idled:Connect(function()
    if antiAFKEnabled then
        pcall(function()
            VirtualUser:CaptureController()
            VirtualUser:ClickButton2(Vector2.new())
        end)
    end
end)

local OptPanel = ConfigTab:AddPanel("Optimization")
OptPanel:AddSection("Performance Boost")
OptPanel:AddWideButton({
    Title = "Boost FPS (ปิดกราฟิก)",
    Description = "ลดคุณภาพกราฟิกเพื่อเพิ่มความลื่นไหล",
    Callback = function()
        pcall(function()
            for _, v in pairs(Workspace:GetDescendants()) do
                if v:IsA("Part") or v:IsA("UnionOperation") or v:IsA("MeshPart") then
                    v.Material = Enum.Material.Plastic
                    v.Reflectance = 0
                elseif v:IsA("Decal") or v:IsA("Texture") then
                    v.Transparency = 1
                elseif v:IsA("ParticleEmitter") or v:IsA("Trail") then
                    v.Enabled = false
                end
            end
            for _, v in pairs(Lighting:GetChildren()) do
                if v:IsA("PostProcessEffect") then v.Enabled = false end
            end
        end)
        game.StarterGui:SetCore("SendNotification", { Title = "OSX HUB", Text = "FPS Boosted!", Duration = 3 })
    end
})

local MenuPanel = ConfigTab:AddPanel("Menu Settings")
MenuPanel:AddWideButton({
    Title = "Unload Script",
    Description = "ปิดการทำงานของสคริปต์และลบ UI",
    Callback = function()
        FOVCircle:Remove()
        Window:Destroy()
    end
})

print("OSX HUB | Universal Script v2 Loaded Successfully")