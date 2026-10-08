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
        FastHandling = false,
        HandlingSpeed = 5,
        FastReload = false,
        ReloadSpeed = 5,
        FastSwing = false,
        SwingSpeed = 5,
        FastHeal = false
    },
    Visuals = {
        ZombieChams = false,
        ZombieNames = false,
        PlayerChams = false,
        PlayerNames = false,
        ESPColor = Color3.fromRGB(255, 60, 60),
        PlayerESPColor = Color3.fromRGB(60, 255, 60)
    },
    Movement = {
        WalkSpeedEnabled = false,
        WalkSpeed = 16
    }
}

-- [[ SERVICES & PLAYERS ]] --
local Players = game:GetService("Players")
local v1 = Players.LocalPlayer

-- [[ UI INITIALIZATION ]] --
local Window = OSX:CreateWindow({
    Title = "OSX HUB | OUT EXECUTION",
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
local Tab2 = Window:AddTab({ Title = "Combat", Icon = "crosshair", SubDescription = "Combat & Weapon Mods" })
local CombatPanel = Tab2:AddPanel("Weapon Modifications")

CombatPanel:AddToggle({
    Title = "Fast Handling",
    Description = "เปิดใช้งานการถือ/สลับปืนเร็วขึ้น",
    Default = false,
    Callback = function(v) Config.Combat.FastHandling = v end
})

CombatPanel:AddSlider({
    Title = "Handling Speed Value",
    Description = "ความเร็วการถือปืน (แนะนำ 2-5 เพื่อเลี่ยง Error ของปืนบางชนิด)",
    Min = 1,
    Max = 30,
    Default = 5,
    Rounding = 1,
    Callback = function(v) Config.Combat.HandlingSpeed = v end
})

CombatPanel:AddToggle({
    Title = "Fast Reload",
    Description = "เปิดใช้งานการรีโหลดเร็วขึ้น",
    Default = false,
    Callback = function(v) Config.Combat.FastReload = v end
})

CombatPanel:AddSlider({
    Title = "Reload Speed Value",
    Description = "ความเร็วรีโหลด (แนะนำ 2-5 เพื่อเลี่ยง Error ของปืนบางชนิด)",
    Min = 1,
    Max = 30,
    Default = 5,
    Rounding = 1,
    Callback = function(v) Config.Combat.ReloadSpeed = v end
})

CombatPanel:AddToggle({
    Title = "Fast Swing",
    Description = "เปิดใช้งานการฟันเร็วขึ้น",
    Default = false,
    Callback = function(v) Config.Combat.FastSwing = v end
})

CombatPanel:AddSlider({
    Title = "Swing Speed Value",
    Description = "ความเร็วการฟัน (แนะนำ 2-5 เพื่อเลี่ยง Error)",
    Min = 1,
    Max = 30,
    Default = 5,
    Rounding = 1,
    Callback = function(v) Config.Combat.SwingSpeed = v end
})

CombatPanel:AddToggle({
    Title = "Fast Heal (1 Sec)",
    Description = "ลดเวลาการพันผ้าพันแผล / ฮีลเหลือเพียง 1 วินาที",
    Default = false,
    Callback = function(v) 
        Config.Combat.FastHeal = v
        EnableFastHeal(v)
    end
})

local MovementPanel = Tab2:AddPanel("Movement Modifications")

MovementPanel:AddToggle({
    Title = "WalkSpeed Enabled",
    Description = "เปิด/ปิด การจำกัดความเร็วเคลื่อนที่",
    Default = false,
    Callback = function(v) Config.Movement.WalkSpeedEnabled = v end
})

MovementPanel:AddSlider({
    Title = "WalkSpeed Value",
    Description = "ปรับระดับความเร็วในการเดิน (16 - 300)",
    Min = 16,
    Max = 300,
    Default = 16,
    Rounding = 1,
    Callback = function(v)
        Config.Movement.WalkSpeed = v
    end
})

-- [[ 2. VISUALS TAB ]] --
local Tab2 = Window:AddTab({ Title = "Visuals", Icon = "eye", SubDescription = "ESP & Visuals" })
local VisualsPanel = Tab2:AddPanel("Zombie ESP")

VisualsPanel:AddToggle({
    Title = "Zombie Chams",
    Description = "แสดงออร่า (Box) มองทะลุซอมบี้ทั้งหมด",
    Default = false,
    Callback = function(v) Config.Visuals.ZombieChams = v end
})

VisualsPanel:AddToggle({
    Title = "Zombie Names",
    Description = "แสดงชื่อของซอมบี้ทั้งหมด",
    Default = false,
    Callback = function(v) Config.Visuals.ZombieNames = v end
})

local PlayerVisualsPanel = Tab2:AddPanel("Player ESP")

PlayerVisualsPanel:AddToggle({
    Title = "Player Chams",
    Description = "แสดงออร่า Chams มองทะลุผู้เล่นคนอื่นทั้งหมด",
    Default = false,
    Callback = function(v) Config.Visuals.PlayerChams = v end
})

PlayerVisualsPanel:AddToggle({
    Title = "Player Names",
    Description = "แสดงชื่อของผู้เล่นคนอื่นทั้งหมด",
    Default = false,
    Callback = function(v) Config.Visuals.PlayerNames = v end
})

-- [[ LOGIC: FAST HEAL ]] --
local FastHealConnections = {}

local function EnableFastHeal(enabled)
    for _, conn in ipairs(FastHealConnections) do
        pcall(function() conn:Disconnect() end)
    end
    table.clear(FastHealConnections)
    
    if enabled then
        local function checkCharacter(char)
            if not char then return end
            
            local toolConn
            toolConn = char.ChildAdded:Connect(function(child)
                if child:IsA("Tool") and child:FindFirstChild("HealPlayer") then
                    local eatting = child:FindFirstChild("Eatting")
                    local stoppedEatting = child:FindFirstChild("StoppedEatting")
                    local healPlayer = child:FindFirstChild("HealPlayer")
                    
                    if eatting and healPlayer then
                        local eatConn
                        eatConn = eatting.Event:Connect(function(targetModel)
                            if not Config.Combat.FastHeal then return end
                            if not targetModel or not targetModel:FindFirstChild("Humanoid") then return end
                            
                            task.wait(1) -- Wait 1 second
                            
                            if child.Parent == char and char:FindFirstChildOfClass("Humanoid") and char:FindFirstChildOfClass("Humanoid").Health > 0 then
                                pcall(function()
                                    local hrp = char:FindFirstChild("HumanoidRootPart")
                                    local targetHrp = targetModel:FindFirstChild("HumanoidRootPart") or hrp
                                    local targetHum = targetModel:FindFirstChildOfClass("Humanoid")
                                    
                                    healPlayer:FireServer(hrp.Position, targetHrp.Position, 90, targetHum, true, v1)
                                    
                                    if stoppedEatting and stoppedEatting:IsA("BindableEvent") then
                                        stoppedEatting:Fire()
                                    end
                                end)
                            end
                        end)
                        table.insert(FastHealConnections, eatConn)
                    end
                end
            end)
            table.insert(FastHealConnections, toolConn)
        end
        
        local char = workspace:FindFirstChild("AlivePlayers") and workspace.AlivePlayers:FindFirstChild(v1.Name) or v1.Character
        checkCharacter(char)
        
        local charAddedConn
        charAddedConn = v1.CharacterAdded:Connect(function(newChar)
            task.wait(0.5)
            checkCharacter(newChar)
        end)
        table.insert(FastHealConnections, charAddedConn)
    end
end

-- [[ LOGIC: WALKSPEED ]] --
local RunService = game:GetService("RunService")
RunService.Heartbeat:Connect(function()
    if Config.Movement.WalkSpeedEnabled then
        local localChar = workspace:FindFirstChild("AlivePlayers") and workspace.AlivePlayers:FindFirstChild(v1.Name) or v1.Character
        if localChar then
            local humanoid = localChar:FindFirstChildOfClass("Humanoid")
            if humanoid then
                humanoid.WalkSpeed = Config.Movement.WalkSpeed
            end
        end
    end
end)

-- [[ LOGIC: ESP UPDATER ]] --
local ZombieESP = {}
local PlayerESP = {}

local function ApplyHighlight(instance, color)
    local highlight = instance:FindFirstChild("OSX_Chams")
    if not highlight then
        highlight = Instance.new("Highlight")
        highlight.Name = "OSX_Chams"
        highlight.Adornee = instance
        highlight.DepthMode = Enum.HighlightDepthMode.AlwaysOnTop
        highlight.FillTransparency = 0.5
        highlight.OutlineTransparency = 0
        highlight.Parent = instance
    end
    highlight.FillColor = color
    highlight.OutlineColor = color
    highlight.Enabled = true
end

local function RemoveHighlight(instance)
    local highlight = instance:FindFirstChild("OSX_Chams")
    if highlight then
        pcall(function() highlight:Destroy() end)
    end
end

-- 1. ZOMBIE ESP: 2D Corner Box + Health Bar
local function CreateZombieESP(instance, color, targetTable)
    local targetPart = instance:IsA("BasePart") and instance or (instance:IsA("Model") and instance.PrimaryPart) or instance:FindFirstChild("HumanoidRootPart") or instance:FindFirstChildOfClass("BasePart")
    if not targetPart then return end

    local billboard = Instance.new("BillboardGui")
    billboard.Name = "OSX_ZombieCornerBox"
    billboard.AlwaysOnTop = true
    billboard.Size = UDim2.new(5.0, 0, 6.0, 0) -- Increased width slightly to fit health bar
    billboard.Adornee = targetPart
    billboard.Parent = instance
    billboard.Enabled = false

    -- Container for the Corner Box lines (shifted to the right to leave space for health bar)
    local container = Instance.new("Frame")
    container.BackgroundTransparency = 1
    container.Position = UDim2.new(0.12, 0, 0, 0)
    container.Size = UDim2.new(0.88, 0, 1, 0)
    container.Parent = billboard

    local thickness = 2.5
    local length = 0.22

    local function makeLine(pos, sz)
        local line = Instance.new("Frame")
        line.BackgroundColor3 = color
        line.BorderSizePixel = 0
        line.Position = pos
        line.Size = sz
        line.Parent = container
        return line
    end

    local lines = {
        makeLine(UDim2.new(0, 0, 0, 0), UDim2.new(0, thickness, length, 0)),
        makeLine(UDim2.new(0, 0, 0, 0), UDim2.new(length, 0, 0, thickness)),
        makeLine(UDim2.new(1, -thickness, 0, 0), UDim2.new(0, thickness, length, 0)),
        makeLine(UDim2.new(1 - length, 0, 0, 0), UDim2.new(length, 0, 0, thickness)),
        makeLine(UDim2.new(0, 0, 1 - length, 0), UDim2.new(0, thickness, length, 0)),
        makeLine(UDim2.new(0, 0, 1, -thickness), UDim2.new(length, 0, 0, thickness)),
        makeLine(UDim2.new(1, -thickness, 1 - length, 0), UDim2.new(0, thickness, length, 0)),
        makeLine(UDim2.new(1 - length, 0, 1, -thickness), UDim2.new(length, 0, 0, thickness)),
    }

    -- Health Bar Background (Black outline border) - Parented directly to billboard
    local healthBarBg = Instance.new("Frame")
    healthBarBg.Name = "HealthBarBg"
    healthBarBg.BorderSizePixel = 0
    healthBarBg.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
    healthBarBg.Position = UDim2.new(0, 0, 0, 0)
    healthBarBg.Size = UDim2.new(0.08, 0, 1, 0)
    healthBarBg.Parent = billboard

    -- Health Bar Fill
    local healthBar = Instance.new("Frame")
    healthBar.Name = "HealthBar"
    healthBar.BorderSizePixel = 0
    healthBar.BackgroundColor3 = Color3.fromRGB(0, 255, 0)
    healthBar.Size = UDim2.new(1, 0, 1, 0)
    healthBar.Position = UDim2.new(0, 0, 0, 0)
    healthBar.Parent = healthBarBg

    local nameBillboard = Instance.new("BillboardGui")
    nameBillboard.Name = "OSX_ZombieName"
    nameBillboard.AlwaysOnTop = true
    nameBillboard.Size = UDim2.new(0, 120, 0, 30)
    nameBillboard.StudsOffset = Vector3.new(0, 3.2, 0)
    nameBillboard.Adornee = targetPart
    nameBillboard.Parent = instance
    nameBillboard.Enabled = false

    local label = Instance.new("TextLabel")
    label.BackgroundTransparency = 1
    label.Size = UDim2.new(1, 0, 1, 0)
    label.Text = instance.Name
    label.TextColor3 = color
    label.TextSize = 13
    label.Font = Enum.Font.SourceSansBold
    label.TextStrokeTransparency = 0.2
    label.TextStrokeColor3 = Color3.new(0, 0, 0)
    label.Parent = nameBillboard

    targetTable[instance] = {
        CornerBox = billboard,
        NameTag = nameBillboard,
        Label = label,
        Lines = lines,
        HealthBar = healthBar
    }
end

local function UpdateZombieESP(boxEnabled, namesEnabled, folder, targetTable, color)
    if (boxEnabled or namesEnabled) and folder then
        for _, item in ipairs(folder:GetChildren()) do
            if item:IsA("Model") then
                local isDead = false
                local hum = item:FindFirstChildOfClass("Humanoid")
                if hum and hum.Health <= 0 then
                    isDead = true
                end

                if not isDead then
                    local esp = targetTable[item]
                    if not esp then
                        CreateZombieESP(item, color, targetTable)
                        esp = targetTable[item]
                    end
                    
                    if esp then
                        if esp.CornerBox then
                            esp.CornerBox.Enabled = boxEnabled
                            for _, line in ipairs(esp.Lines) do
                                line.BackgroundColor3 = color
                            end
                        end
                        if hum and esp.HealthBar then
                            local healthPercent = math.clamp(hum.Health / hum.MaxHealth, 0, 1)
                            esp.HealthBar.Size = UDim2.new(1, 0, healthPercent, 0)
                            esp.HealthBar.Position = UDim2.new(0, 0, 1 - healthPercent, 0)
                            esp.HealthBar.BackgroundColor3 = Color3.fromRGB(255, 0, 0):Lerp(Color3.fromRGB(0, 255, 0), healthPercent)
                        end
                        if esp.NameTag and esp.Label then
                            esp.NameTag.Enabled = namesEnabled
                            esp.Label.TextColor3 = color
                        end
                    end
                end
            end
        end
    end
    
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

        if isDead or (not boxEnabled and not namesEnabled) then
            pcall(function()
                if esp.CornerBox then esp.CornerBox:Destroy() end
                if esp.NameTag then esp.NameTag:Destroy() end
            end)
            targetTable[instance] = nil
        end
    end
end

-- 2. PLAYER ESP: Highlight Chams
local function CreatePlayerESP(instance, color, targetTable)
    local targetPart = instance:IsA("BasePart") and instance or (instance:IsA("Model") and instance.PrimaryPart) or instance:FindFirstChild("HumanoidRootPart") or instance:FindFirstChildOfClass("BasePart")
    if not targetPart then return end

    local nameBillboard = Instance.new("BillboardGui")
    nameBillboard.Name = "OSX_PlayerName"
    nameBillboard.AlwaysOnTop = true
    nameBillboard.Size = UDim2.new(0, 120, 0, 30)
    nameBillboard.StudsOffset = Vector3.new(0, 3.2, 0)
    nameBillboard.Adornee = targetPart
    nameBillboard.Parent = instance
    nameBillboard.Enabled = false

    local label = Instance.new("TextLabel")
    label.BackgroundTransparency = 1
    label.Size = UDim2.new(1, 0, 1, 0)
    label.Text = instance.Name
    label.TextColor3 = color
    label.TextSize = 13
    label.Font = Enum.Font.SourceSansBold
    label.TextStrokeTransparency = 0.2
    label.TextStrokeColor3 = Color3.new(0, 0, 0)
    label.Parent = nameBillboard

    targetTable[instance] = {
        NameTag = nameBillboard,
        Label = label
    }
end

local function UpdatePlayerESP(chamsEnabled, namesEnabled, folder, targetTable, color)
    if (chamsEnabled or namesEnabled) and folder then
        for _, item in ipairs(folder:GetChildren()) do
            if item:IsA("Model") then
                local isDead = false
                local hum = item:FindFirstChildOfClass("Humanoid")
                if hum and hum.Health <= 0 then
                    isDead = true
                end

                if not isDead and item.Name ~= v1.Name then
                    local esp = targetTable[item]
                    if not esp then
                        CreatePlayerESP(item, color, targetTable)
                        esp = targetTable[item]
                    end
                    
                    if esp then
                        if chamsEnabled then
                            ApplyHighlight(item, color)
                        else
                            RemoveHighlight(item)
                        end
                        if esp.NameTag and esp.Label then
                            esp.NameTag.Enabled = namesEnabled
                            esp.Label.TextColor3 = color
                        end
                    end
                end
            end
        end
    end
    
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
                RemoveHighlight(instance)
                if esp.NameTag then esp.NameTag:Destroy() end
            end)
            targetTable[instance] = nil
        end
    end
end

task.spawn(function()
    while true do
        local AliveZombiesFolder = workspace:FindFirstChild("AliveZombies")
        UpdateZombieESP(
            Config.Visuals.ZombieChams,
            Config.Visuals.ZombieNames,
            AliveZombiesFolder, 
            ZombieESP, 
            Config.Visuals.ESPColor
        )

        local AlivePlayersFolder = workspace:FindFirstChild("AlivePlayers")
        UpdatePlayerESP(
            Config.Visuals.PlayerChams,
            Config.Visuals.PlayerNames,
            AlivePlayersFolder,
            PlayerESP,
            Config.Visuals.PlayerESPColor
        )
        task.wait(1)
    end
end)

-- [[ COMBAT MODIFIER LOOP ]] --
task.spawn(function()
    while true do
        local localChar = (workspace:FindFirstChild("AlivePlayers") and workspace.AlivePlayers:FindFirstChild(v1.Name)) or v1.Character
        if localChar then
            -- HandlingSpeed Modifier
            if Config.Combat.FastHandling then
                if localChar:GetAttribute("HandlingSpeed") ~= Config.Combat.HandlingSpeed then
                    localChar:SetAttribute("HandlingSpeed", Config.Combat.HandlingSpeed)
                end
            else
                if localChar:GetAttribute("HandlingSpeed") ~= 1 then
                    localChar:SetAttribute("HandlingSpeed", 1)
                end
            end

            -- ReloadSpeed Modifier
            if Config.Combat.FastReload then
                if localChar:GetAttribute("ReloadSpeed") ~= Config.Combat.ReloadSpeed then
                    localChar:SetAttribute("ReloadSpeed", Config.Combat.ReloadSpeed)
                end
            else
                if localChar:GetAttribute("ReloadSpeed") ~= 1 then
                    localChar:SetAttribute("ReloadSpeed", 1)
                end
            end

            -- SwingSpeed Modifier
            if Config.Combat.FastSwing then
                if localChar:GetAttribute("SwingSpeed") ~= Config.Combat.SwingSpeed then
                    localChar:SetAttribute("SwingSpeed", Config.Combat.SwingSpeed)
                end
            else
                if localChar:GetAttribute("SwingSpeed") ~= 1 then
                    localChar:SetAttribute("SwingSpeed", 1)
                end
            end
        end
        task.wait(0.1)
    end
end)


-- [[ NOTIFY ]] --
OSX:Notify({
    Title = "OSX HUB",
    Content = GameName .. " script ready!",
    Type = "Success"
})