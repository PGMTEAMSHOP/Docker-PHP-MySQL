local successName, GameInfo = pcall(function() return game:GetService("MarketplaceService"):GetProductInfo(game.PlaceId) end)
local GameName = successName and GameInfo.Name or "Unknown Game"
local OSX = loadstring(game:HttpGet("https://raw.githubusercontent.com/yxucnx/OSX-HUB-Lib/refs/heads/main/OSX_Lib.lua?v=" .. tick()))()

-- Services
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")
local LocalPlayer = Players.LocalPlayer
local Mouse = LocalPlayer:GetMouse()
local Camera = workspace.CurrentCamera

-- Settings
local Settings = {
    Aimbot = {
        Enabled = false,
        Key = Enum.UserInputType.MouseButton2,
        TargetPart = "Head",
        Smoothness = 1,
        UseFOV = false,
        FOVRadius = 100,
        FOVColor = Color3.fromRGB(255, 255, 255)
    },
    Weapon = {
        AutoReload = false
    },
    Visuals = {
        SkeletonEnabled = false,
        SkeletonColor = Color3.fromRGB(255, 255, 255),
        SkeletonThickness = 1,
        SkeletonTransparency = 1
    }
}

-- FOV Circle
local FOVCircle = Drawing.new("Circle")
FOVCircle.Thickness = 2
FOVCircle.NumSides = 60
FOVCircle.Radius = Settings.Aimbot.FOVRadius
FOVCircle.Filled = false
FOVCircle.Visible = false
FOVCircle.Color = Settings.Aimbot.FOVColor

-- Logic Functions
-- Logic Variables
local CachedTargets = {}
local Skeletons = {}

-- Background Target Scanner (Optimized for Workspace)
task.spawn(function()
    while true do
        local targets = {}
        
        -- 1. Scan Players Service (Most Reliable)
        for _, player in ipairs(Players:GetPlayers()) do
            if player ~= LocalPlayer and player.Character then
                local hum = player.Character:FindFirstChildOfClass("Humanoid")
                if hum and hum.Health > 0 then
                    table.insert(targets, player.Character)
                end
            end
        end
        
        -- 2. Scan Workspace directly (since characters are in Workspace directly)
        for _, obj in ipairs(workspace:GetChildren()) do
            if obj:IsA("Model") and obj ~= LocalPlayer.Character then
                local hum = obj:FindFirstChildOfClass("Humanoid")
                if hum and hum.Health > 0 then
                    if not table.find(targets, obj) then
                        table.insert(targets, obj)
                    end
                end
            end
        end
        
        CachedTargets = targets
        task.wait(1)
    end
end)

local function GetTargets()
    return CachedTargets
end

local function GetClosestTarget()
    local ClosestTarget = nil
    local MaxDistance = Settings.Aimbot.UseFOV and Settings.Aimbot.FOVRadius or math.huge
    local MousePos = Vector2.new(Camera.ViewportSize.X / 2, Camera.ViewportSize.Y / 2)

    for _, Character in ipairs(GetTargets()) do
        local TargetPart = Character:FindFirstChild(Settings.Aimbot.TargetPart) or Character:FindFirstChild("HumanoidRootPart")
        if TargetPart then
            local ScreenPos, OnScreen = Camera:WorldToViewportPoint(TargetPart.Position)

            if OnScreen then
                local Distance = (Vector2.new(ScreenPos.X, ScreenPos.Y) - MousePos).Magnitude

                if Distance < MaxDistance then
                    MaxDistance = Distance
                    ClosestTarget = Character
                end
            end
        end
    end
    return ClosestTarget
end

local function GetSkeleton(Character)
    if Skeletons[Character] then return Skeletons[Character] end
    
    local lines = {}
    local function createLine()
        local l = Drawing.new("Line")
        l.Thickness = Settings.Visuals.SkeletonThickness
        l.Color = Settings.Visuals.SkeletonColor
        l.Transparency = Settings.Visuals.SkeletonTransparency
        l.Visible = false
        table.insert(lines, l)
        return l
    end
    
    -- Define connections (supporting R15 and R6)
    local connections = {
        -- R15 Joints
        {"Head", "UpperTorso"}, {"UpperTorso", "LowerTorso"},
        {"UpperTorso", "LeftUpperArm"}, {"LeftUpperArm", "LeftLowerArm"}, {"LeftLowerArm", "LeftHand"},
        {"UpperTorso", "RightUpperArm"}, {"RightUpperArm", "RightLowerArm"}, {"RightLowerArm", "RightHand"},
        {"LowerTorso", "LeftUpperLeg"}, {"LeftUpperLeg", "LeftLowerLeg"}, {"LeftLowerLeg", "LeftFoot"},
        {"LowerTorso", "RightUpperLeg"}, {"RightUpperLeg", "RightLowerLeg"}, {"RightLowerLeg", "RightFoot"},
        -- R6 Joints
        {"Head", "Torso"}, {"Torso", "Left Arm"}, {"Torso", "Right Arm"}, 
        {"Torso", "Left Leg"}, {"Torso", "Right Leg"}
    }
    
    local skeletonData = {
        Lines = {},
        Connections = connections
    }
    
    for _ = 1, #connections do
        table.insert(skeletonData.Lines, createLine())
    end
    
    Skeletons[Character] = skeletonData
    return skeletonData
end

local function ClearSkeleton(Character)
    local data = Skeletons[Character]
    if data then
        for _, line in ipairs(data.Lines) do
            line.Visible = false
            line:Remove()
        end
        Skeletons[Character] = nil
    end
end

local function UpdateSkeleton(Character)
    if not Settings.Visuals.SkeletonEnabled then
        ClearSkeleton(Character)
        return
    end

    local data = GetSkeleton(Character)
    local onScreenCount = 0
    
    for i, connection in ipairs(data.Connections) do
        local part1 = Character:FindFirstChild(connection[1])
        local part2 = Character:FindFirstChild(connection[2])
        local line = data.Lines[i]
        
        if part1 and part2 then
            local pos1, onScreen1 = Camera:WorldToViewportPoint(part1.Position)
            local pos2, onScreen2 = Camera:WorldToViewportPoint(part2.Position)
            
            if onScreen1 or onScreen2 then
                line.From = Vector2.new(pos1.X, pos1.Y)
                line.To = Vector2.new(pos2.X, pos2.Y)
                line.Color = Settings.Visuals.SkeletonColor
                line.Thickness = Settings.Visuals.SkeletonThickness
                line.Transparency = Settings.Visuals.SkeletonTransparency
                line.Visible = true
                onScreenCount = onScreenCount + 1
            else
                line.Visible = false
            end
        else
            line.Visible = false
        end
    end
    
    if onScreenCount == 0 then
        -- Optional: Hide skeleton if no parts are on screen
    end
end



local Window = OSX:CreateWindow({
    Title = "OSX HUB | " .. GameName,
    Subtitle = "Made by: LilYouDev1997 | Discord: discord.gg/osxhub",
    WindowLogo = "https://img2.pic.in.th/logo512v2.png",
    FloatingLogo = "https://img1.pic.in.th/images/logo512v1.png",
    ToggleKey = Enum.KeyCode.RightControl
})

local InfoTab = Window:AddTab({
    Title = "info",
    Icon = "info",
    SubDescription = "Script Information"
})

local DevPanel = InfoTab:AddPanel("Developer Panel")
DevPanel:AddInfoLabel("Owner", "darkmxde.")
DevPanel:AddInfoLabel("Developer", "LilYouDev1997")
DevPanel:AddInfoLabel("Last Update", "18/04/2026")

DevPanel:AddButton({
    Title = "Join Discord",
    Description = "คลิกเพื่อคัดลอกลิงก์ Discord",
    Callback = function()
        setclipboard("https://discord.gg/osxhub")
        OSX:Notify({Title = "Clipboard", Content = "Discord Link Copied!"})
    end
})

local CombatTab = Window:AddTab({
    Title = "Combat",
    SubDescription = "Combat & Weapon Assistance",
    Icon = "rbxassetid://4483345998"
})

local AimbotPanel = CombatTab:AddPanel("Aimbot Settings")

AimbotPanel:AddToggle({
    Title = "Enabled",
    Description = "เปิดใช้งานการล็อกเป้าศัตรู",
    Default = Settings.Aimbot.Enabled,
    Callback = function(Value)
        Settings.Aimbot.Enabled = Value
    end
})

AimbotPanel:AddDropdown({
    Title = "Target Part",
    Description = "เลือกส่วนของร่างกายที่จะล็อกเป้า",
    Values = {"Head", "HumanoidRootPart", "Right Arm"},
    Default = Settings.Aimbot.TargetPart,
    Callback = function(Option)
        Settings.Aimbot.TargetPart = Option
    end
})

AimbotPanel:AddSlider({
    Title = "Smoothness",
    Description = "ปรับความนิ่งและความสมูทในการล็อกเป้า",
    Min = 0.1,
    Max = 1,
    Default = Settings.Aimbot.Smoothness,
    Callback = function(Value)
        Settings.Aimbot.Smoothness = Value
    end
})

local FOVPanel = CombatTab:AddPanel("FOV Settings")

FOVPanel:AddToggle({
    Title = "Use FOV",
    Description = "เปิดใช้งานวงกลมขอบเขตการล็อกเป้า",
    Default = Settings.Aimbot.UseFOV,
    Callback = function(Value)
        Settings.Aimbot.UseFOV = Value
    end
})

FOVPanel:AddSlider({
    Title = "FOV Radius",
    Description = "ปรับขนาดรัศมีของวงกลม FOV",
    Min = 10,
    Max = 800,
    Default = Settings.Aimbot.FOVRadius,
    Callback = function(Value)
        Settings.Aimbot.FOVRadius = Value
    end
})

FOVPanel:AddColorPicker({
    Title = "FOV Color",
    Description = "เปลี่ยนสีของวงกลม FOV",
    Default = Settings.Aimbot.FOVColor,
    Callback = function(Value)
        Settings.Aimbot.FOVColor = Value
    end
})

local WeaponPanel = CombatTab:AddPanel("Weapon Settings")

WeaponPanel:AddToggle({
    Title = "Auto Reload",
    Description = "รีโหลดกระสุนให้อัตโนมัติเมื่อกระสุนหมด",
    Default = Settings.Weapon.AutoReload,
    Callback = function(Value)
        Settings.Weapon.AutoReload = Value
    end
})

local VisualsTab = Window:AddTab({
    Title = "Visuals",
    SubDescription = "Player ESP & Effects",
    Icon = "rbxassetid://4483345998"
})

local SkeletonPanel = VisualsTab:AddPanel("Skeleton Settings")

SkeletonPanel:AddToggle({
    Title = "Enabled",
    Description = "แสดงโครงกระดูกตัวละครทะลุกำแพง",
    Default = Settings.Visuals.SkeletonEnabled,
    Callback = function(Value)
        Settings.Visuals.SkeletonEnabled = Value
    end
})

SkeletonPanel:AddColorPicker({
    Title = "Skeleton Color",
    Description = "เลือกสีของเส้นโครงกระดูก",
    Default = Settings.Visuals.SkeletonColor,
    Callback = function(Value)
        Settings.Visuals.SkeletonColor = Value
    end
})

SkeletonPanel:AddSlider({
    Title = "Thickness",
    Description = "ความหนาของเส้น",
    Min = 1,
    Max = 5,
    Default = Settings.Visuals.SkeletonThickness,
    Callback = function(Value)
        Settings.Visuals.SkeletonThickness = Value
    end
})

local SettingsTab = Window:AddTab({
    Title = "Settings",
    Icon = "settings",
    SubDescription = "UI & Config"
})

local ConfigPanel = SettingsTab:AddPanel("UI Management")

ConfigPanel:AddButton({
    Title = "Destroy UI",
    Description = "ปิดการทำงานของเมนูและสคริปต์ทั้งหมด",
    Callback = function()
        Window:Destroy()
    end
})

-- Update Loops
RunService.RenderStepped:Connect(function()
    -- Auto Reload Logic
    if Settings.Weapon.AutoReload then
        local Tool = LocalPlayer.Character and LocalPlayer.Character:FindFirstChildOfClass("Tool")
        if Tool then
            -- Try to find ammo value (common names: Ammo, CurrentAmmo, Mag)
            local Ammo = Tool:FindFirstChild("Ammo") or Tool:FindFirstChild("CurrentAmmo") or Tool:FindFirstChild("Mag")
            if Ammo and Ammo.Value == 0 then
                local ReloadRemote = LocalPlayer:FindFirstChild("ClientRemotes") and LocalPlayer.ClientRemotes:FindFirstChild("Reload")
                if ReloadRemote then
                    ReloadRemote:FireServer()
                end
            end
        end
    end

    -- FOV Circle Position
    local CenterScreen = Vector2.new(Camera.ViewportSize.X / 2, Camera.ViewportSize.Y / 2)
    FOVCircle.Position = CenterScreen
    FOVCircle.Visible = Settings.Aimbot.UseFOV and Settings.Aimbot.Enabled
    FOVCircle.Radius = Settings.Aimbot.FOVRadius
    FOVCircle.Color = Settings.Aimbot.FOVColor

    -- Aimbot
    if Settings.Aimbot.Enabled and UserInputService:IsMouseButtonPressed(Settings.Aimbot.Key) then
        local Target = GetClosestTarget()
        if Target then
            local TargetPart = Target:FindFirstChild(Settings.Aimbot.TargetPart) or Target:FindFirstChild("HumanoidRootPart")
            if TargetPart then
                local TargetPos = TargetPart.Position
                local CurrentCF = Camera.CFrame
                local TargetCF = CFrame.new(CurrentCF.Position, TargetPos)
                
                Camera.CFrame = CurrentCF:Lerp(TargetCF, Settings.Aimbot.Smoothness)
            end
        end
    end

    -- Visuals (Skeleton ESP)
    if Settings.Visuals.SkeletonEnabled then
        for _, Character in ipairs(GetTargets()) do
            if Character and Character.Parent then
                UpdateSkeleton(Character)
            end
        end
        
        -- Clean up skeletons for players no longer in targets or dead
        for char, _ in pairs(Skeletons) do
            local hum = char:FindFirstChildOfClass("Humanoid")
            if not char or not char.Parent or (hum and hum.Health <= 0) then
                ClearSkeleton(char)
            end
        end
    else
        if next(Skeletons) then
            for char, _ in pairs(Skeletons) do
                ClearSkeleton(char)
            end
        end
    end
end)
