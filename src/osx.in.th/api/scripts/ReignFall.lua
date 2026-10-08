local successName, GameInfo = pcall(function() return game:GetService("MarketplaceService"):GetProductInfo(game.PlaceId) end)
local GameName = successName and GameInfo.Name or "Unknown Game"

-- [[ LIBRARY LOADER ]] --
local success, OSX = pcall(function()
    return loadstring(readfile("OSX_Lib.lua"))()
end)

if not success or not OSX then
    warn("OSX: Local file not found or failed to load, loading from GitHub...")
    local githubSuccess, githubOSX = pcall(function()
        return loadstring(game:HttpGet("https://raw.githubusercontent.com/yxucnx/OSX-HUB-Lib/refs/heads/main/OSX_Lib.lua?v=" .. tick()))()
    end)
    if githubSuccess and githubOSX then
        OSX = githubOSX
    else
        error("OSX: Failed to load library from both local file and GitHub!")
    end
end

-- [[ CONFIGURATION ]] --
local Config = {
    Combat = {
        KillAura = false
    },
    Visuals = {
        EnemyChams = false,
        EnemyNames = false,
        ESPColor = Color3.fromRGB(255, 0, 0),
        MissionItemChams = false,
        MissionItemNames = false,
        MissionItemColor = Color3.fromRGB(0, 255, 0),
        FullBright = false
    }
}

-- [[ SERVICES & PLAYERS ]] --
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local Lighting = game:GetService("Lighting")
local v1 = Players.LocalPlayer

-- [[ LIGHTING BACKUP ]] --
local OriginalLighting = {
    Brightness = Lighting.Brightness,
    ClockTime = Lighting.ClockTime,
    GlobalShadows = Lighting.GlobalShadows,
    OutdoorAmbient = Lighting.OutdoorAmbient,
    Ambient = Lighting.Ambient
}

-- [[ UI INITIALIZATION ]] --
local Window = OSX:CreateWindow({
    Title = "OSX HUB | REIGN FALL",
    Subtitle = "Made by: LilYouDev1997 | Discord: discord.gg/osxhub",
    WindowLogo = "https://img2.pic.in.th/logo512v2.png",
    FloatingLogo = "https://img1.pic.in.th/images/logo512v1.png",
    ToggleKey = Enum.KeyCode.RightControl
})

-- [[ 1. INFO TAB ]] --
local Tab1 = Window:AddTab({ Title = "Info", Icon = "info", SubDescription = "Script Information" })

local DevPanel = Tab1:AddPanel("Developer Panel")
DevPanel:AddInfoLabel("Owner", "darkmxde.")
DevPanel:AddInfoLabel("Developer Main", "LilYouDev1997x")
DevPanel:AddInfoLabel("Developer Support", "0b1100001cat")

DevPanel:AddButton({
    Title = "Join Discord",
    Description = "คลิกเพื่อคัดลอกลิงก์ Discord",
    Callback = function()
        setclipboard("https://discord.gg/osxhub")
        OSX:Notify({Title = "Clipboard", Content = "Discord Link Copied!"})
    end
})

-- [[ 2. COMBAT TAB ]] --
local Tab2 = Window:AddTab({ Title = "Combat", Icon = "crosshair", SubDescription = "Combat Assistances" })
local CombatPanel = Tab2:AddPanel("Combat Features")

CombatPanel:AddToggle({
    Title = "Kill Aura",
    Description = "โจมตีเป้าหมายทั้งหมดรอบตัวโดยอัตโนมัติ",
    Default = false,
    Callback = function(v) Config.Combat.KillAura = v end
})

-- [[ 3. VISUALS TAB ]] --
local Tab3 = Window:AddTab({ Title = "Visuals", Icon = "eye", SubDescription = "ESP & Visuals" })
local VisualsPanel = Tab3:AddPanel("Enemy ESP")

VisualsPanel:AddToggle({
    Title = "Enemy Chams",
    Description = "แสดงออร่า (Box) มองทะลุศัตรูทั้งหมด",
    Default = false,
    Callback = function(v) Config.Visuals.EnemyChams = v end
})

VisualsPanel:AddToggle({
    Title = "Enemy Names",
    Description = "แสดงชื่อของศัตรูทั้งหมด",
    Default = false,
    Callback = function(v) Config.Visuals.EnemyNames = v end
})

VisualsPanel:AddSection("Items")

VisualsPanel:AddToggle({
    Title = "Mission Item Chams",
    Description = "แสดงออร่า (Box) ไอเทมภารกิจ",
    Default = false,
    Callback = function(v) Config.Visuals.MissionItemChams = v end
})

VisualsPanel:AddToggle({
    Title = "Mission Item Names",
    Description = "แสดงชื่อของไอเทมภารกิจ",
    Default = false,
    Callback = function(v) Config.Visuals.MissionItemNames = v end
})

VisualsPanel:AddSection("Environment")

VisualsPanel:AddToggle({
    Title = "Full Bright",
    Description = "เพิ่มความสว่างเเละลบเงาออกจากแผนที่",
    Default = false,
    Callback = function(v) Config.Visuals.FullBright = v end
})

-- [[ LOGIC FUNCTIONS ]] --
local function findRegisterHitEvent()
    local v3 = v1.Character
    if not v3 then
        return nil
    end

    for v2, v4 in ipairs(v3:GetChildren()) do
        local v9 = v4:FindFirstChild("ServerEvents")
        if v9 then
            local v8 = v9:FindFirstChild("RegisterHit")
            if v8 and v8:IsA("RemoteEvent") then
                return v8
            end
        end
    end
    return nil
end

local function getTargets()
    local v11 = {}
    
    for v2, v7 in ipairs(workspace:GetDescendants()) do
        if v7:IsA("Model") and v7:FindFirstChild("Humanoid") and v7 ~= v1.Character then
            local v12 = v7:FindFirstChild("Torso") or v7:FindFirstChild("HumanoidRootPart")
            if v12 then
                table.insert(v11, {model = v7, part = v12})
            end
        end
    end

    if #v11 == 0 and typeof(getnilinstances) == "function" then
        for v2, v7 in ipairs(getnilinstances()) do
            if v7:IsA("Model") then
                local v12 = v7:FindFirstChild("Torso") or v7:FindFirstChild("HumanoidRootPart")
                if v12 then
                    table.insert(v11, {model = v7, part = v12})
                end
            end
        end
    end

    return v11
end

-- [[ COMBAT LOOP ]] --
task.spawn(function()
    while task.wait(0.2) do
        if Config.Combat.KillAura then
            local v5 = findRegisterHitEvent()
            if v5 then
                local v11 = getTargets()
                if #v11 > 0 then
                    local v6 = {}
                    for v2, v10 in ipairs(v11) do
                        table.insert(v6, {
                            amount = 1,
                            target = v10.model,
                            is_friendly = false,
                            part = v10.part
                        })
                    end

                    if #v6 > 0 then
                        v5:FireServer(v6, {})
                    end
                end
            end
        end
    end
end)

-- [[ LOGIC: ESP UPDATER ]] --
local ZombieESP = {}
local ItemESP = {}

local function CreateAdornments(instance, color, targetTable, isItem)
    local parts = {}
    local descendants = instance:IsA("BasePart") and {instance} or instance:GetDescendants()
    for _, part in ipairs(descendants) do
        if part:IsA("BasePart") then
            local adornment = Instance.new("BoxHandleAdornment")
            adornment.Name = isItem and "OSX_ItemAdorn" or "OSX_ZombieAdorn"
            adornment.Size = part.Size + Vector3.new(0.05, 0.05, 0.05)
            adornment.Color3 = color
            adornment.Transparency = 0.6
            adornment.AlwaysOnTop = true
            adornment.ZIndex = 5
            adornment.Adornee = part
            adornment.Parent = part
            adornment.Visible = false
            table.insert(parts, adornment)
        end
    end
    
    local espObj = { Adornments = parts }
    
    local targetPart = instance:IsA("BasePart") and instance or (instance:IsA("Model") and instance.PrimaryPart) or instance:FindFirstChildOfClass("BasePart")
    if targetPart then
        local billboard = Instance.new("BillboardGui")
        billboard.Name = isItem and "OSX_ItemName" or "OSX_ZombieName"
        billboard.AlwaysOnTop = true
        billboard.Size = UDim2.new(0, 100, 0, 30)
        billboard.StudsOffset = Vector3.new(0, 2, 0)
        billboard.Adornee = targetPart
        billboard.Parent = instance
        billboard.Enabled = false
        
        local label = Instance.new("TextLabel")
        label.BackgroundTransparency = 1
        label.Size = UDim2.new(1, 0, 1, 0)
        label.Text = instance.Name
        label.TextColor3 = color
        label.TextSize = 14
        label.Font = Enum.Font.SourceSansBold
        label.TextStrokeTransparency = 0
        label.TextStrokeColor3 = Color3.new(0, 0, 0)
        label.Parent = billboard
        
        espObj.Billboard = billboard
        espObj.Label = label
    end
    
    targetTable[instance] = espObj
end

local function UpdateESP(chamsEnabled, namesEnabled, folder, targetTable, color, isItem, filterFunc)
    if (chamsEnabled or namesEnabled) and folder then
        for _, item in ipairs(folder:GetDescendants()) do
            if filterFunc(item) then
                local isDead = false
                if item:IsA("Model") then
                    local hum = item:FindFirstChildOfClass("Humanoid")
                    if hum and hum.Health <= 0 then
                        isDead = true
                    end
                end

                if not isDead then
                    local esp = targetTable[item]
                    if not esp then
                        CreateAdornments(item, color, targetTable, isItem)
                        esp = targetTable[item]
                    end
                    
                    if esp then
                        -- Check for dynamically loaded parts (handles spawning delay)
                        local descendants = item:IsA("BasePart") and {item} or item:GetDescendants()
                        local currentPartsCount = 0
                        for _, p in ipairs(descendants) do
                            if p:IsA("BasePart") then
                                currentPartsCount = currentPartsCount + 1
                            end
                        end
                        
                        if currentPartsCount > #esp.Adornments then
                            for _, adornment in ipairs(esp.Adornments) do
                                pcall(function() adornment:Destroy() end)
                            end
                            esp.Adornments = {}
                            for _, part in ipairs(descendants) do
                                if part:IsA("BasePart") then
                                    local adornment = Instance.new("BoxHandleAdornment")
                                    adornment.Name = isItem and "OSX_ItemAdorn" or "OSX_ZombieAdorn"
                                    adornment.Size = part.Size + Vector3.new(0.05, 0.05, 0.05)
                                    adornment.Color3 = color
                                    adornment.Transparency = 0.6
                                    adornment.AlwaysOnTop = true
                                    adornment.ZIndex = 5
                                    adornment.Adornee = part
                                    adornment.Parent = part
                                    table.insert(esp.Adornments, adornment)
                                end
                            end
                        end

                        -- Update visibility
                        for _, adornment in ipairs(esp.Adornments) do
                            if adornment.Parent then
                                adornment.Visible = chamsEnabled
                                adornment.Color3 = color
                            end
                        end
                        if esp.Billboard and esp.Label then
                            esp.Billboard.Enabled = namesEnabled
                            esp.Label.TextColor3 = color
                        end
                    end
                end
            end
        end
    end
    
    -- Cleanup destroyed, dead or disabled instances
    for instance, esp in pairs(targetTable) do
        local isDead = false
        if instance and instance.Parent then
            local hum = instance:FindFirstChildOfClass("Humanoid")
            if hum and hum.Health <= 0 then
                isDead = true
            end
        else
            isDead = true
        end

        if isDead or (not chamsEnabled and not namesEnabled) then
            pcall(function()
                for _, adornment in ipairs(esp.Adornments) do
                    if adornment.Parent then adornment:Destroy() end
                end
                if esp.Billboard and esp.Billboard.Parent then
                    esp.Billboard:Destroy()
                end
            end)
            targetTable[instance] = nil
        end
    end
end

task.spawn(function()
    while true do
        -- NPCs ESP (Zombie)
        local NPCsFolder = workspace:FindFirstChild("Game")
            and workspace.Game:FindFirstChild("Current")
            and workspace.Game.Current:FindFirstChild("Spawned")
            and workspace.Game.Current.Spawned:FindFirstChild("NPCs")

        UpdateESP(
            Config.Visuals.EnemyChams,
            Config.Visuals.EnemyNames,
            NPCsFolder, 
            ZombieESP, 
            Config.Visuals.ESPColor, 
            false, 
            function(item) return item:IsA("Model") end
        )

        -- Mission Items ESP
        local ObjectsFolder = workspace:FindFirstChild("Game")
            and workspace.Game:FindFirstChild("Current")
            and workspace.Game.Current:FindFirstChild("Spawned")
            and workspace.Game.Current.Spawned:FindFirstChild("GameObjects")

        UpdateESP(
            Config.Visuals.MissionItemChams,
            Config.Visuals.MissionItemNames,
            ObjectsFolder, 
            ItemESP, 
            Config.Visuals.MissionItemColor, 
            true, 
            function(item) 
                return item.Name == "mission_item"
            end
        )

        -- Full Bright Enforcement
        if Config.Visuals.FullBright then
            Lighting.Brightness = 2
            Lighting.ClockTime = 14
            Lighting.GlobalShadows = false
            Lighting.OutdoorAmbient = Color3.new(1, 1, 1)
            Lighting.Ambient = Color3.new(1, 1, 1)
        else
            Lighting.Brightness = OriginalLighting.Brightness
            Lighting.ClockTime = OriginalLighting.ClockTime
            Lighting.GlobalShadows = OriginalLighting.GlobalShadows
            Lighting.OutdoorAmbient = OriginalLighting.OutdoorAmbient
            Lighting.Ambient = OriginalLighting.Ambient
        end

        task.wait(1)
    end
end)

-- [[ NOTIFY ]] --
OSX:Notify({
    Title = "OSX HUB",
    Content = GameName .. " script ready!",
    Type = "Success"
})